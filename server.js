const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AUTH
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashed);
  res.json({ success: true, user: { id: result.lastInsertRowid, name, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'No account found with this email' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// COURTS
app.get('/api/courts', (req, res) => {
  const { sport } = req.query;
  const courts = sport ? db.prepare('SELECT * FROM courts WHERE sport = ?').all(sport) : db.prepare('SELECT * FROM courts').all();
  res.json(courts);
});

// AVAILABILITY
app.get('/api/availability', (req, res) => {
  const { court_id, date } = req.query;
  const allSlots = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  const booked = db.prepare('SELECT time_slot FROM bookings WHERE court_id = ? AND date = ? AND status = "confirmed"').all(court_id, date).map(r => r.time_slot);
  res.json(allSlots.map(slot => ({ time: slot, available: !booked.includes(slot) })));
});

// BOOKINGS
app.post('/api/bookings', (req, res) => {
  const { court_id, user_name, user_email, date, time_slot } = req.body;
  const existing = db.prepare('SELECT id FROM bookings WHERE court_id = ? AND date = ? AND time_slot = ? AND status = "confirmed"').get(court_id, date, time_slot);
  if (existing) return res.status(409).json({ error: 'This slot is already booked!' });
  const result = db.prepare('INSERT INTO bookings (court_id, user_name, user_email, date, time_slot) VALUES (?, ?, ?, ?, ?)').run(court_id, user_name, user_email, date, time_slot);
  res.json({ success: true, booking_id: result.lastInsertRowid });
});

app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  const bookings = db.prepare('SELECT b.*, c.name as court_name, c.sport, c.location FROM bookings b JOIN courts c ON b.court_id = c.id WHERE b.user_email = ? ORDER BY b.date DESC, b.time_slot').all(email);
  res.json(bookings);
});

app.delete('/api/bookings/:id', (req, res) => {
  db.prepare('UPDATE bookings SET status = "cancelled" WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// LEADERBOARD
app.get('/api/leaderboard', (req, res) => {
  const leaders = db.prepare('SELECT user_name, user_email, c.sport, COUNT(*) as total_sessions, COUNT(*) as total_hours FROM bookings b JOIN courts c ON b.court_id = c.id WHERE b.status = "confirmed" GROUP BY b.user_email, c.sport ORDER BY total_sessions DESC LIMIT 50').all();
  res.json(leaders);
});

app.get('/api/leaderboard/overall', (req, res) => {
  const leaders = db.prepare('SELECT user_name, user_email, COUNT(*) as total_sessions FROM bookings WHERE status = "confirmed" GROUP BY user_email ORDER BY total_sessions DESC LIMIT 20').all();
  res.json(leaders);
});

// EVENTS
app.get('/api/events', (req, res) => {
  const events = db.prepare('SELECT e.*, COUNT(er.id) as registered_count FROM events e LEFT JOIN event_registrations er ON e.id = er.event_id GROUP BY e.id ORDER BY e.event_date').all();
  res.json(events);
});

app.post('/api/events/:id/register', (req, res) => {
  const { user_email, user_name } = req.body;
  const existing = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_email = ?').get(req.params.id, user_email);
  if (existing) return res.status(409).json({ error: 'Already registered for this event' });
  db.prepare('INSERT INTO event_registrations (event_id, user_email, user_name) VALUES (?, ?, ?)').run(req.params.id, user_email, user_name);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SportZone running on http://localhost:' + PORT));
