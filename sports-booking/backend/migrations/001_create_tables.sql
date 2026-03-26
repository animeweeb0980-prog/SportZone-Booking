-- migrations/001_create_tables.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name TEXT,
  address TEXT,
  city TEXT,
  lat NUMERIC,
  lng NUMERIC,
  sport_types TEXT[],
  amenities TEXT[]
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  venue_id INT REFERENCES venues(id),
  sport VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  capacity INT,
  price NUMERIC(8,2),
  status VARCHAR(20) DEFAULT 'open'
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  event_id INT REFERENCES events(id),
  seats INT,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT now()
);
