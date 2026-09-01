const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'bedbooking.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ical_feeds (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'other')),
  url TEXT NOT NULL,
  last_synced_at TEXT,
  last_sync_status TEXT,
  last_sync_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  ical_feed_id TEXT REFERENCES ical_feeds(id) ON DELETE SET NULL,
  uid TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'other', 'manual')),
  source TEXT NOT NULL CHECK (source IN ('ical', 'manual')) DEFAULT 'manual',
  guest_name TEXT,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_feed_uid
  ON bookings(ical_feed_id, uid) WHERE ical_feed_id IS NOT NULL AND uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
`);

module.exports = db;
