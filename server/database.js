import Database from 'better-sqlite3';

const db = new Database('server/sportzone.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// Ensure tables are correctly structured
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    description TEXT,
    location TEXT,
    price_per_hour REAL DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    court_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (court_id) REFERENCES courts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sport TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TEXT NOT NULL,
    event_time TEXT DEFAULT '09:00',
    max_participants INTEGER DEFAULT 20,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial courts if none exist
const courtCount = db.prepare('SELECT COUNT(*) as count FROM courts').get();
if (courtCount.count === 0) {
  const ins = db.prepare('INSERT INTO courts (name, sport, description, location, price_per_hour) VALUES (?, ?, ?, ?, ?)');
  ins.run('Tennis Court A', 'tennis', 'Full-size outdoor tennis court with floodlights', 'Sports Complex, Block A', 10);
  ins.run('Tennis Court B', 'tennis', 'Indoor climate-controlled tennis court', 'Sports Complex, Block B', 15);
  ins.run('Pickleball Court 1', 'pickleball', 'Dedicated pickleball court with net', 'Recreation Center, Floor 1', 8);
  ins.run('Pickleball Court 2', 'pickleball', 'Shared multi-use pickleball court', 'Recreation Center, Floor 2', 8);
  ins.run('Badminton Hall 1', 'badminton', 'Olympic-standard indoor badminton court', 'Indoor Stadium, Hall 1', 6);
  ins.run('Badminton Hall 2', 'badminton', 'Beginner-friendly badminton court', 'Indoor Stadium, Hall 2', 6);
  ins.run('Football Turf A', 'football', '5-a-side artificial turf football field', 'Turf Ground, Sector 1', 20);
  ins.run('Football Turf B', 'football', 'Full-size natural grass football field', 'Turf Ground, Sector 2', 30);
  ins.run('Volleyball Court 1', 'volleyball', 'Indoor competition volleyball court', 'Sports Hall, Ground Floor', 10);
  ins.run('Volleyball Court 2', 'volleyball', 'Beach volleyball court with sand', 'Outdoor Arena, Beach Road', 10);
}

// Seed initial events if none exist
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
if (eventCount.count === 0) {
  const ie = db.prepare('INSERT INTO events (title, sport, description, location, event_date, event_time, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?)');
  ie.run('Summer Tennis Open', 'tennis', 'Annual summer tennis tournament open to all skill levels!', 'Sports Complex', '2026-04-15', '09:00', 32);
  ie.run('Pickleball Doubles Championship', 'pickleball', 'Exciting doubles tournament. Find a partner and sign up!', 'Recreation Center', '2026-04-22', '10:00', 24);
  ie.run('Badminton League Week 1', 'badminton', 'Weekly badminton league. Round-robin format.', 'Indoor Stadium', '2026-04-10', '18:00', 16);
  ie.run('5-a-side Football Cup', 'football', 'Team football tournament. Register your team of 5!', 'Turf Ground', '2026-05-01', '08:00', 50);
  ie.run('Volleyball Beginner Clinic', 'volleyball', 'Free beginner clinic for new players!', 'Sports Hall', '2026-04-18', '11:00', 20);
}

export default db;
