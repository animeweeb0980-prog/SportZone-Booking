const Database = require('better-sqlite3');
const db = new Database('sportzone.db');

db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, avatar TEXT DEFAULT "🏆", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
db.exec('CREATE TABLE IF NOT EXISTS courts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sport TEXT NOT NULL, description TEXT, location TEXT, price_per_hour REAL DEFAULT 0)');
db.exec('CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, court_id INTEGER NOT NULL, user_name TEXT NOT NULL, user_email TEXT NOT NULL, date TEXT NOT NULL, time_slot TEXT NOT NULL, duration INTEGER DEFAULT 1, status TEXT DEFAULT "confirmed", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (court_id) REFERENCES courts(id))');
db.exec('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, sport TEXT NOT NULL, description TEXT, location TEXT, event_date TEXT NOT NULL, max_participants INTEGER DEFAULT 20, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
db.exec('CREATE TABLE IF NOT EXISTS event_registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, user_email TEXT, user_name TEXT, registered_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

const courtCount = db.prepare('SELECT COUNT(*) as count FROM courts').get();
if (courtCount.count === 0) {
  const insert = db.prepare('INSERT INTO courts (name, sport, description, location, price_per_hour) VALUES (?, ?, ?, ?, ?)');
  insert.run('Tennis Court A', 'tennis', 'Full-size outdoor tennis court with floodlights', 'Sports Complex, Block A', 10);
  insert.run('Tennis Court B', 'tennis', 'Indoor climate-controlled tennis court', 'Sports Complex, Block B', 15);
  insert.run('Pickleball Court 1', 'pickleball', 'Dedicated pickleball court with net', 'Recreation Center', 8);
  insert.run('Pickleball Court 2', 'pickleball', 'Shared multi-use pickleball court', 'Recreation Center', 8);
  insert.run('Badminton Hall 1', 'badminton', 'Olympic-standard indoor badminton court', 'Indoor Stadium, Hall 1', 6);
  insert.run('Badminton Hall 2', 'badminton', 'Beginner-friendly badminton court', 'Indoor Stadium, Hall 2', 6);
  insert.run('Football Turf A', 'football', '5-a-side artificial turf football field', 'Turf Ground, Sector 1', 20);
  insert.run('Football Turf B', 'football', 'Full-size natural grass football field', 'Turf Ground, Sector 2', 30);
  insert.run('Volleyball Court 1', 'volleyball', 'Indoor competition volleyball court', 'Sports Hall, Ground Floor', 10);
  insert.run('Volleyball Court 2', 'volleyball', 'Beach volleyball court with sand', 'Outdoor Arena', 10);
}

const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
if (eventCount.count === 0) {
  const insertEvent = db.prepare('INSERT INTO events (title, sport, description, location, event_date, max_participants) VALUES (?, ?, ?, ?, ?, ?)');
  insertEvent.run('Summer Tennis Open', 'tennis', 'Annual summer tennis tournament open to all skill levels. Prizes for winners!', 'Sports Complex', '2026-04-15', 32);
  insertEvent.run('Pickleball Doubles Championship', 'pickleball', 'Exciting doubles tournament. Find a partner and sign up today!', 'Recreation Center', '2026-04-22', 24);
  insertEvent.run('Badminton League Week 1', 'badminton', 'Weekly badminton league matches. Round-robin format.', 'Indoor Stadium', '2026-04-10', 16);
  insertEvent.run('5-a-side Football Cup', 'football', 'Team football tournament. Register your team of 5 players.', 'Turf Ground', '2026-05-01', 40);
  insertEvent.run('Volleyball Beginner Clinic', 'volleyball', 'Free beginner clinic for new players. Learn the basics!', 'Sports Hall', '2026-04-18', 20);
}

module.exports = db;
