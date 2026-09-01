const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function serializeBooking(b) {
  return b;
}

router.get('/', (req, res) => {
  const { property_id, platform, status, from, to } = req.query;
  const clauses = [];
  const params = {};

  if (property_id) {
    clauses.push('b.property_id = @property_id');
    params.property_id = property_id;
  }
  if (platform) {
    clauses.push('b.platform = @platform');
    params.platform = platform;
  }
  if (status) {
    clauses.push('b.status = @status');
    params.status = status;
  } else {
    clauses.push("b.status != 'cancelled'");
  }
  if (from) {
    clauses.push('b.check_out >= @from');
    params.from = from;
  }
  if (to) {
    clauses.push('b.check_in <= @to');
    params.to = to;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT b.*, p.name AS property_name
       FROM bookings b JOIN properties p ON p.id = b.property_id
       ${where}
       ORDER BY b.check_in ASC`
    )
    .all(params);
  res.json(rows.map(serializeBooking));
});

router.get('/arrivals', (req, res) => {
  const days = Math.max(0, Math.min(30, parseInt(req.query.days, 10) || 1));
  const rows = db
    .prepare(
      `SELECT b.*, p.name AS property_name
       FROM bookings b JOIN properties p ON p.id = b.property_id
       WHERE b.status != 'cancelled'
         AND date(b.check_in) BETWEEN date('now') AND date('now', '+' || ? || ' days')
       ORDER BY b.check_in ASC, b.arrival_time ASC`
    )
    .all(days);
  res.json(rows.map(serializeBooking));
});

router.post('/', (req, res) => {
  const { property_id, platform, guest_name, check_in, check_out, arrival_time, departure_time, notes } = req.body;

  if (!property_id) return res.status(400).json({ error: 'Struttura obbligatoria' });
  const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(property_id);
  if (!property) return res.status(400).json({ error: 'Struttura non trovata' });

  if (!DATE_RE.test(check_in || '')) return res.status(400).json({ error: 'Data check-in non valida' });
  if (!DATE_RE.test(check_out || '')) return res.status(400).json({ error: 'Data check-out non valida' });
  if (check_out < check_in) return res.status(400).json({ error: 'Il check-out non può precedere il check-in' });
  if (arrival_time && !TIME_RE.test(arrival_time)) return res.status(400).json({ error: 'Orario di arrivo non valido' });
  if (departure_time && !TIME_RE.test(departure_time)) return res.status(400).json({ error: 'Orario di partenza non valido' });

  const validPlatform = ['airbnb', 'booking', 'other', 'manual'].includes(platform) ? platform : 'manual';

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO bookings (id, property_id, ical_feed_id, uid, platform, source, guest_name, check_in, check_out, arrival_time, departure_time, notes)
     VALUES (?, ?, NULL, NULL, ?, 'manual', ?, ?, ?, ?, ?, ?)`
  ).run(id, property_id, validPlatform, guest_name || null, check_in, check_out, arrival_time || null, departure_time || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Prenotazione non trovata' });

  const { guest_name, check_in, check_out, arrival_time, departure_time, notes, status } = req.body;

  const next = {
    guest_name: guest_name !== undefined ? guest_name : booking.guest_name,
    check_in: check_in !== undefined ? check_in : booking.check_in,
    check_out: check_out !== undefined ? check_out : booking.check_out,
    arrival_time: arrival_time !== undefined ? arrival_time : booking.arrival_time,
    departure_time: departure_time !== undefined ? departure_time : booking.departure_time,
    notes: notes !== undefined ? notes : booking.notes,
    status: status !== undefined ? status : booking.status,
  };

  if (!DATE_RE.test(next.check_in)) return res.status(400).json({ error: 'Data check-in non valida' });
  if (!DATE_RE.test(next.check_out)) return res.status(400).json({ error: 'Data check-out non valida' });
  if (next.check_out < next.check_in) return res.status(400).json({ error: 'Il check-out non può precedere il check-in' });
  if (next.arrival_time && !TIME_RE.test(next.arrival_time)) return res.status(400).json({ error: 'Orario di arrivo non valido' });
  if (next.departure_time && !TIME_RE.test(next.departure_time)) return res.status(400).json({ error: 'Orario di partenza non valido' });
  if (!['confirmed', 'cancelled'].includes(next.status)) return res.status(400).json({ error: 'Stato non valido' });

  db.prepare(
    `UPDATE bookings SET guest_name = ?, check_in = ?, check_out = ?, arrival_time = ?, departure_time = ?, notes = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    next.guest_name || null,
    next.check_in,
    next.check_out,
    next.arrival_time || null,
    next.departure_time || null,
    next.notes || null,
    next.status,
    booking.id
  );

  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Prenotazione non trovata' });
  res.status(204).end();
});

module.exports = router;
