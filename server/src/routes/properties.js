const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { syncFeed } = require('../icalSync');

const router = express.Router();

router.get('/', (req, res) => {
  const properties = db.prepare('SELECT * FROM properties ORDER BY name').all();
  const feeds = db.prepare('SELECT * FROM ical_feeds').all();
  const feedsByProperty = {};
  for (const f of feeds) {
    (feedsByProperty[f.property_id] ||= []).push(f);
  }
  res.json(properties.map((p) => ({ ...p, feeds: feedsByProperty[p.id] || [] })));
});

router.get('/:id', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Struttura non trovata' });
  const feeds = db.prepare('SELECT * FROM ical_feeds WHERE property_id = ?').all(property.id);
  res.json({ ...property, feeds });
});

router.post('/', (req, res) => {
  const { name, address, notes } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Il nome della struttura è obbligatorio' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO properties (id, name, address, notes) VALUES (?, ?, ?, ?)').run(
    id,
    name.trim(),
    address || null,
    notes || null
  );
  res.status(201).json(db.prepare('SELECT * FROM properties WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Struttura non trovata' });
  const { name, address, notes } = req.body;
  db.prepare('UPDATE properties SET name = ?, address = ?, notes = ? WHERE id = ?').run(
    name?.trim() || property.name,
    address ?? property.address,
    notes ?? property.notes,
    property.id
  );
  res.json(db.prepare('SELECT * FROM properties WHERE id = ?').get(property.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Struttura non trovata' });
  res.status(204).end();
});

// --- iCal feeds (link Airbnb / Booking.com per la struttura) ---

router.post('/:id/feeds', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Struttura non trovata' });
  const { platform, url } = req.body;
  if (!platform || !['airbnb', 'booking', 'other'].includes(platform)) {
    return res.status(400).json({ error: 'Piattaforma non valida' });
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'URL iCal non valido' });
  }
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO ical_feeds (id, property_id, platform, url) VALUES (?, ?, ?, ?)').run(
    id,
    property.id,
    platform,
    url.trim()
  );
  const feed = db.prepare('SELECT * FROM ical_feeds WHERE id = ?').get(id);

  // Sync immediately in the background so the calendar fills in without
  // the user having to remember to hit "sync".
  syncFeed(id).catch(() => {});

  res.status(201).json(feed);
});

router.delete('/feeds/:feedId', (req, res) => {
  const result = db.prepare('DELETE FROM ical_feeds WHERE id = ?').run(req.params.feedId);
  if (result.changes === 0) return res.status(404).json({ error: 'Feed non trovato' });
  res.status(204).end();
});

router.post('/feeds/:feedId/sync', async (req, res) => {
  const feed = db.prepare('SELECT * FROM ical_feeds WHERE id = ?').get(req.params.feedId);
  if (!feed) return res.status(404).json({ error: 'Feed non trovato' });
  const result = await syncFeed(feed.id);
  res.json(result);
});

module.exports = router;
