import { useEffect, useState } from 'react';
import { api } from '../api';
import { useProperties } from '../context/PropertiesContext';
import PlatformBadge from '../components/PlatformBadge';
import PaymentBadge from '../components/PaymentBadge';
import BookingFormModal from '../components/BookingFormModal';
import { formatDateShort } from '../utils';

export default function Bookings() {
  const { properties } = useProperties();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ property_id: '', platform: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getBookings(filters);
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.property_id, filters.platform]);

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

  async function handleDelete(booking) {
    if (!confirm(`Eliminare la prenotazione di ${booking.guest_name || 'ospite'}?`)) return;
    try {
      await api.deleteBooking(booking.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTogglePayment(booking) {
    setTogglingId(booking.id);
    try {
      const next = booking.payment_status === 'paid' ? 'unpaid' : 'paid';
      await api.updateBooking(booking.id, { payment_status: next });
      setBookings((list) => list.map((b) => (b.id === booking.id ? { ...b, payment_status: next } : b)));
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Prenotazioni</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Nuova prenotazione
        </button>
      </div>

      <div className="filters">
        <select value={filters.property_id} onChange={(e) => setFilters((f) => ({ ...f, property_id: e.target.value }))}>
          <option value="">Tutte le strutture</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={filters.platform} onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
          <option value="">Tutte le piattaforme</option>
          <option value="airbnb">Airbnb</option>
          <option value="booking">Booking.com</option>
          <option value="manual">Manuale</option>
          <option value="other">Altro</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Caricamento…</p>
      ) : bookings.length === 0 ? (
        <p className="muted">Nessuna prenotazione trovata.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ospite</th>
                <th>Struttura</th>
                <th>Piattaforma</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Arrivo</th>
                <th>Pagamento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.guest_name || '—'}</td>
                  <td>{b.property_name}</td>
                  <td><PlatformBadge platform={b.platform} /></td>
                  <td>{formatDateShort(b.check_in)}</td>
                  <td>{formatDateShort(b.check_out)}</td>
                  <td>{b.arrival_time || '—'}</td>
                  <td>
                    <PaymentBadge
                      status={b.payment_status}
                      busy={togglingId === b.id}
                      onToggle={() => handleTogglePayment(b)}
                    />
                  </td>
                  <td className="table-actions">
                    <button className="btn-link" onClick={() => { setEditing(b); setShowForm(true); }}>Modifica</button>
                    <button className="btn-link btn-link-danger" onClick={() => handleDelete(b)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <BookingFormModal
          booking={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
