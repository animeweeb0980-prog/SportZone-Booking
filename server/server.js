import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';
import { sendBookingConfirmation, sendEventRegistrationEmail } from './email.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sportzone_key_2026';

// ── MIDDLEWARE ───────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token.' });
    req.user = user;
    next();
  });
};

// ── AUTH ─────────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashed);

  const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: result.lastInsertRowid, name, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'No account found with this email' });

  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// ── COURTS ───────────────────────────────────────────────
app.get('/api/courts', (req, res) => {
  const { sport } = req.query;
  const courts = sport && sport !== 'all'
    ? db.prepare('SELECT * FROM courts WHERE sport = ?').all(sport)
    : db.prepare('SELECT * FROM courts').all();
  res.json(courts);
});

// ── AVAILABILITY ─────────────────────────────────────────
app.get('/api/availability', (req, res) => {
  const { court_id, date } = req.query;
  if (!court_id || !date) return res.status(400).json({ error: 'court_id and date are required' });

  const allSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  const booked = db.prepare("SELECT time_slot FROM bookings WHERE court_id = ? AND date = ? AND status = 'confirmed'").all(court_id, date).map(r => r.time_slot);

  const result = allSlots.map(slot => ({ time: slot, available: !booked.includes(slot) }));
  res.json(result);
});

// ── BOOKINGS ─────────────────────────────────────────────
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { court_id, date, time_slot } = req.body;
  if (!court_id || !date || !time_slot) return res.status(400).json({ error: 'All fields required' });

  const existing = db.prepare("SELECT id FROM bookings WHERE court_id = ? AND date = ? AND time_slot = ? AND status = 'confirmed'").get(court_id, date, time_slot);
  if (existing) return res.status(409).json({ error: 'This slot is already booked!' });

  const courtInfo = db.prepare('SELECT name, location FROM courts WHERE id = ?').get(court_id);
  if (!courtInfo) return res.status(404).json({ error: 'Court not found' });

  const result = db.prepare('INSERT INTO bookings (court_id, user_id, user_name, user_email, date, time_slot) VALUES (?, ?, ?, ?, ?, ?)').run(court_id, req.user.id, req.user.name, req.user.email, date, time_slot);

  // Fire and forget email
  sendBookingConfirmation(req.user.email, req.user.name, courtInfo.name, courtInfo.location, date, time_slot);

  res.json({ success: true, booking_id: result.lastInsertRowid });
});

app.get('/api/bookings', authenticateToken, (req, res) => {
  const bookings = db.prepare('SELECT b.*, c.name as court_name, c.sport, c.location FROM bookings b JOIN courts c ON b.court_id = c.id WHERE b.user_id = ? ORDER BY b.date DESC, b.time_slot').all(req.user.id);
  res.json(bookings);
});

app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
  const booking = db.prepare('SELECT user_id FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to cancel this booking' });

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── LEADERBOARD ──────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const { sport } = req.query;
  const leaders = sport && sport !== 'overall'
    ? db.prepare("SELECT b.user_name, b.user_email, COUNT(*) as total_sessions FROM bookings b JOIN courts c ON b.court_id = c.id WHERE b.status = 'confirmed' AND c.sport = ? GROUP BY b.user_email ORDER BY total_sessions DESC LIMIT 20").all(sport)
    : db.prepare("SELECT user_name, user_email, COUNT(*) as total_sessions FROM bookings WHERE status = 'confirmed' GROUP BY user_email ORDER BY total_sessions DESC LIMIT 20").all();
  res.json(leaders);
});

// ── EVENTS ───────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let userId = -1;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) { }
  }

  const events = db.prepare(`
    SELECT e.*, 
           COUNT(er.id) as registered_count,
           MAX(CASE WHEN er.user_id = ? THEN 1 ELSE 0 END) as is_registered
    FROM events e 
    LEFT JOIN event_registrations er ON e.id = er.event_id 
    GROUP BY e.id 
    ORDER BY e.event_date
  `).all(userId);
  res.json(events);
});

app.post('/api/events/:id/register', authenticateToken, (req, res) => {
  const { user_phone } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const regCount = db.prepare('SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?').get(req.params.id);
  if (regCount.count >= event.max_participants) return res.status(400).json({ error: 'Event is full' });

  const existing = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already registered for this event' });

  db.prepare('INSERT INTO event_registrations (event_id, user_id, user_name, user_email, user_phone) VALUES (?, ?, ?, ?, ?)').run(req.params.id, req.user.id, req.user.name, req.user.email, user_phone || '');

  sendEventRegistrationEmail(req.user.email, req.user.name, event.title, event.location, event.event_date, event.event_time);

  res.json({ success: true, message: 'Successfully registered for ' + event.title });
});

app.delete('/api/events/:id/register', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true, message: 'Successfully unregistered' });
});

app.get('/api/my-registrations', authenticateToken, (req, res) => {
  const regs = db.prepare('SELECT er.*, e.title, e.sport, e.event_date, e.location FROM event_registrations er JOIN events e ON er.event_id = e.id WHERE er.user_id = ?').all(req.user.id);
  res.json(regs);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
