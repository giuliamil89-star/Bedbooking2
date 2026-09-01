import { useEffect, useState } from 'react';
import { api } from '../api';
import PlatformBadge from '../components/PlatformBadge';
import { formatDateLong, isToday } from '../utils';

export default function Dashboard() {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getArrivals(1); // oggi + domani
      setArrivals(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSyncAll() {
    setSyncing(true);
    try {
      await api.syncAll();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleArrivalTimeChange(booking, value) {
    setSavingId(booking.id);
    try {
      await api.updateBooking(booking.id, { arrival_time: value || null });
      setArrivals((list) => list.map((b) => (b.id === booking.id ? { ...b, arrival_time: value } : b)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const todays = arrivals.filter((b) => isToday(b.check_in));
  const tomorrows = arrivals.filter((b) => !isToday(b.check_in));

  return (
    <div>
      <div className="page-header">
        <h1>Arrivi in arrivo</h1>
        <button className="btn btn-secondary" onClick={handleSyncAll} disabled={syncing}>
          {syncing ? 'Sincronizzazione…' : '🔄 Sincronizza Airbnb / Booking'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Caricamento…</p>
      ) : (
        <>
          <ArrivalGroup
            title="Oggi"
            bookings={todays}
            onArrivalTimeChange={handleArrivalTimeChange}
            savingId={savingId}
          />
          <ArrivalGroup
            title="Domani"
            bookings={tomorrows}
            onArrivalTimeChange={handleArrivalTimeChange}
            savingId={savingId}
          />
        </>
      )}
    </div>
  );
}

function ArrivalGroup({ title, bookings, onArrivalTimeChange, savingId }) {
  return (
    <section className="arrival-group">
      <h2>{title} <span className="muted">({bookings.length})</span></h2>
      {bookings.length === 0 ? (
        <p className="muted">Nessun arrivo previsto.</p>
      ) : (
        <div className="arrival-cards">
          {bookings.map((b) => (
            <div className="arrival-card" key={b.id}>
              <div className="arrival-card-top">
                <strong>{b.guest_name || 'Ospite'}</strong>
                <PlatformBadge platform={b.platform} />
              </div>
              <p className="muted">{b.property_name}</p>
              <p className="muted">{formatDateLong(b.check_in)} → {formatDateLong(b.check_out)}</p>
              <label className="arrival-time-input">
                Orario di arrivo
                <input
                  type="time"
                  value={b.arrival_time || ''}
                  onChange={(e) => onArrivalTimeChange(b, e.target.value)}
                  disabled={savingId === b.id}
                />
              </label>
              {b.notes && <p className="notes">📝 {b.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
