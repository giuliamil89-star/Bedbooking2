const ical = require('node-ical');
const crypto = require('crypto');
const db = require('./db');

function toDateStr(d) {
  // node-ical gives JS Date objects (often "date only" floating values for
  // all-day VEVENTs, which is what Airbnb/Booking.com use for stays).
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function guessGuestName(event, platform) {
  const summary = (event.summary || '').trim();
  if (!summary) return platform === 'airbnb' ? 'Prenotazione Airbnb' : 'Prenotazione Booking.com';
  return summary;
}

/**
 * Sync a single ical_feed row: fetch the feed, upsert bookings, mark
 * bookings that disappeared from the feed as cancelled. Never overwrites
 * fields the user is likely to have edited by hand (guest_name, arrival
 * time, notes) once a booking already exists.
 */
async function syncFeed(feedId) {
  const feed = db.prepare('SELECT * FROM ical_feeds WHERE id = ?').get(feedId);
  if (!feed) throw new Error('Feed non trovato');

  const seenUids = [];

  try {
    const events = await ical.async.fromURL(feed.url);

    const upsert = db.prepare(`
      INSERT INTO bookings (id, property_id, ical_feed_id, uid, platform, source, guest_name, check_in, check_out, status, updated_at)
      VALUES (@id, @property_id, @ical_feed_id, @uid, @platform, 'ical', @guest_name, @check_in, @check_out, 'confirmed', datetime('now'))
      ON CONFLICT(ical_feed_id, uid) DO UPDATE SET
        check_in = excluded.check_in,
        check_out = excluded.check_out,
        status = 'confirmed',
        updated_at = datetime('now')
    `);

    const tx = db.transaction((items) => {
      for (const item of items) {
        upsert.run(item);
      }
    });

    const items = [];
    for (const key of Object.keys(events)) {
      const event = events[key];
      if (event.type !== 'VEVENT') continue;
      const uid = event.uid || key;
      const checkIn = toDateStr(event.start);
      const checkOut = toDateStr(event.end) || checkIn;
      if (!checkIn) continue;

      seenUids.push(uid);
      items.push({
        id: crypto.randomUUID(),
        property_id: feed.property_id,
        ical_feed_id: feed.id,
        uid,
        platform: feed.platform,
        guest_name: guessGuestName(event, feed.platform),
        check_in: checkIn,
        check_out: checkOut,
      });
    }

    tx(items);

    // Anything previously imported from this feed but no longer present
    // has been cancelled/removed upstream.
    if (seenUids.length > 0) {
      const placeholders = seenUids.map(() => '?').join(',');
      db.prepare(
        `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now')
         WHERE ical_feed_id = ? AND uid NOT IN (${placeholders}) AND status != 'cancelled'`
      ).run(feed.id, ...seenUids);
    } else {
      db.prepare(
        `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now')
         WHERE ical_feed_id = ? AND status != 'cancelled'`
      ).run(feed.id);
    }

    db.prepare(
      `UPDATE ical_feeds SET last_synced_at = datetime('now'), last_sync_status = 'ok', last_sync_error = NULL WHERE id = ?`
    ).run(feed.id);

    return { ok: true, imported: items.length };
  } catch (err) {
    db.prepare(
      `UPDATE ical_feeds SET last_synced_at = datetime('now'), last_sync_status = 'error', last_sync_error = ? WHERE id = ?`
    ).run(String(err.message || err), feed.id);
    return { ok: false, error: String(err.message || err) };
  }
}

async function syncAllFeeds() {
  const feeds = db.prepare('SELECT id FROM ical_feeds').all();
  const results = [];
  for (const f of feeds) {
    results.push({ feedId: f.id, ...(await syncFeed(f.id)) });
  }
  return results;
}

module.exports = { syncFeed, syncAllFeeds };
