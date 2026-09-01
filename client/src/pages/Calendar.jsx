import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useProperties } from '../context/PropertiesContext';
import PlatformBadge from '../components/PlatformBadge';
import BookingFormModal from '../components/BookingFormModal';
import { toLocalDateStr, todayStr } from '../utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTH_FORMAT = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  // Monday-first grid: JS getDay() is 0=Sunday..6=Saturday.
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function Calendar() {
  const { properties } = useProperties();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [propertyId, setPropertyId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const days = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  async function load() {
    try {
      const from = toLocalDateStr(days[0]);
      const to = toLocalDateStr(days[days.length - 1]);
      const data = await api.getBookings({ from, to, property_id: propertyId || undefined });
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, propertyId]);

  const bookingsByDay = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      let d = new Date(`${b.check_in}T00:00:00`);
      const end = new Date(`${b.check_out}T00:00:00`);
      while (d < end || toLocalDateStr(d) === b.check_in) {
        const key = toLocalDateStr(d);
        (map[key] ||= []).push({ ...b, isArrival: key === b.check_in, isDeparture: key === b.check_out });
        if (toLocalDateStr(d) === b.check_out) break;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
    }
    return map;
  }, [bookings]);

  async function handleSave(form) {
    if (editing) {
      await api.updateBooking(editing.id, form);
    } else {
      await api.createBooking(form);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  const today = todayStr();

  return (
    <div>
      <div className="page-header">
        <h1>Calendario</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          + Nuova prenotazione
        </button>
      </div>

      <div className="filters">
        <div className="month-nav">
          <button className="btn btn-secondary" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>←</button>
          <strong className="month-label">{MONTH_FORMAT.format(cursor)}</strong>
          <button className="btn btn-secondary" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>→</button>
        </div>
        <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
          <option value="">Tutte le strutture</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
      </div>
      <div className="calendar-grid">
        {days.map((d) => {
          const key = toLocalDateStr(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayBookings = bookingsByDay[key] || [];
          return (
            <div
              key={key}
              className={`calendar-cell ${inMonth ? '' : 'calendar-cell-muted'} ${key === today ? 'calendar-cell-today' : ''}`}
              onClick={() => setSelectedDay(key)}
            >
              <div className="calendar-date">{d.getDate()}</div>
              <div className="calendar-events">
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className={`calendar-event platform-${b.platform}`}
                    title={`${b.guest_name || 'Ospite'} — ${b.property_name}`}
                    onClick={(e) => { e.stopPropagation(); setEditing(b); setShowForm(true); }}
                  >
                    {b.isArrival ? '→ ' : b.isDeparture ? '← ' : ''}{b.guest_name || 'Ospite'}
                  </div>
                ))}
                {dayBookings.length > 3 && <div className="calendar-event-more">+{dayBookings.length - 3} altre</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="day-detail">
          <div className="page-header">
            <h2>{selectedDay}</h2>
            <button className="btn-link" onClick={() => setSelectedDay(null)}>Chiudi</button>
          </div>
          {(bookingsByDay[selectedDay] || []).length === 0 ? (
            <p className="muted">Nessuna prenotazione.</p>
          ) : (
            <ul className="day-detail-list">
              {(bookingsByDay[selectedDay] || []).map((b) => (
                <li key={b.id}>
                  <PlatformBadge platform={b.platform} />{' '}
                  <strong>{b.guest_name || 'Ospite'}</strong> — {b.property_name}
                  {b.isArrival && b.arrival_time ? ` (arrivo ore ${b.arrival_time})` : ''}
                  <button className="btn-link" onClick={() => { setEditing(b); setShowForm(true); }}>Modifica</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <BookingFormModal
          booking={editing}
          defaultPropertyId={propertyId || undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
