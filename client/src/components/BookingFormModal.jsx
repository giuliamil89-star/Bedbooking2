import { useState } from 'react';
import { useProperties } from '../context/PropertiesContext';

const emptyForm = {
  property_id: '',
  platform: 'manual',
  guest_name: '',
  check_in: '',
  check_out: '',
  arrival_time: '',
  departure_time: '',
  notes: '',
  status: 'confirmed',
  payment_status: 'unpaid',
};

export default function BookingFormModal({ booking, defaultPropertyId, onSave, onClose }) {
  const { properties } = useProperties();
  const isEdit = Boolean(booking);
  const [form, setForm] = useState(
    booking
      ? {
          property_id: booking.property_id,
          platform: booking.platform,
          guest_name: booking.guest_name || '',
          check_in: booking.check_in,
          check_out: booking.check_out,
          arrival_time: booking.arrival_time || '',
          departure_time: booking.departure_time || '',
          notes: booking.notes || '',
          status: booking.status,
          payment_status: booking.payment_status || 'unpaid',
        }
      : { ...emptyForm, property_id: defaultPropertyId || properties[0]?.id || '' }
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.property_id) return setError('Seleziona una struttura');
    if (!form.check_in || !form.check_out) return setError('Inserisci le date di check-in e check-out');
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Modifica prenotazione' : 'Nuova prenotazione'}</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Struttura
            <select value={form.property_id} onChange={(e) => update('property_id', e.target.value)} required>
              <option value="" disabled>Seleziona…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label>
            Piattaforma
            <select value={form.platform} onChange={(e) => update('platform', e.target.value)}>
              <option value="manual">Manuale</option>
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
              <option value="other">Altro</option>
            </select>
          </label>

          <label>
            Nome ospite
            <input
              type="text"
              value={form.guest_name}
              onChange={(e) => update('guest_name', e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </label>

          <div className="form-row">
            <label>
              Check-in
              <input type="date" value={form.check_in} onChange={(e) => update('check_in', e.target.value)} required />
            </label>
            <label>
              Check-out
              <input type="date" value={form.check_out} onChange={(e) => update('check_out', e.target.value)} required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Orario di arrivo
              <input type="time" value={form.arrival_time} onChange={(e) => update('arrival_time', e.target.value)} />
            </label>
            <label>
              Orario di partenza
              <input type="time" value={form.departure_time} onChange={(e) => update('departure_time', e.target.value)} />
            </label>
          </div>

          <label>
            Note
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Es. arriva in auto, richiede culla…"
            />
          </label>

          <label>
            Pagamento
            <select value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>
              <option value="unpaid">Non pagato</option>
              <option value="paid">Pagato</option>
            </select>
          </label>

          {isEdit && (
            <label>
              Stato
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="confirmed">Confermata</option>
                <option value="cancelled">Annullata</option>
              </select>
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
