import { useState } from 'react';
import { api } from '../api';
import { useProperties } from '../context/PropertiesContext';
import PlatformBadge from '../components/PlatformBadge';

export default function Properties() {
  const { properties, loading, error: loadError, reload } = useProperties();
  const [newProperty, setNewProperty] = useState({ name: '', address: '' });
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProperty.name.trim()) return;
    setCreating(true);
    try {
      await api.createProperty(newProperty);
      setNewProperty({ name: '', address: '' });
      await reload();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProperty(p) {
    if (!confirm(`Eliminare "${p.name}" e tutte le sue prenotazioni?`)) return;
    try {
      await api.deleteProperty(p.id);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Strutture</h1>
      </div>

      {(error || loadError) && <p className="form-error">{error || loadError}</p>}

      <form onSubmit={handleCreate} className="form form-inline">
        <input
          type="text"
          placeholder="Nome struttura (es. Appartamento Centro)"
          value={newProperty.name}
          onChange={(e) => setNewProperty((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Indirizzo (opzionale)"
          value={newProperty.address}
          onChange={(e) => setNewProperty((f) => ({ ...f, address: e.target.value }))}
        />
        <button className="btn btn-primary" type="submit" disabled={creating}>+ Aggiungi struttura</button>
      </form>

      {loading ? (
        <p>Caricamento…</p>
      ) : properties.length === 0 ? (
        <p className="muted">Nessuna struttura ancora. Aggiungine una per iniziare.</p>
      ) : (
        <div className="property-list">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} onDelete={() => handleDeleteProperty(p)} onChange={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property, onDelete, onChange }) {
  const [feedForm, setFeedForm] = useState({ platform: 'airbnb', url: '' });
  const [error, setError] = useState(null);
  const [busyFeedId, setBusyFeedId] = useState(null);
  const [adding, setAdding] = useState(false);

  async function handleAddFeed(e) {
    e.preventDefault();
    if (!feedForm.url.trim()) return;
    setAdding(true);
    try {
      await api.addFeed(property.id, feedForm);
      setFeedForm({ platform: 'airbnb', url: '' });
      await onChange();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSyncFeed(feedId) {
    setBusyFeedId(feedId);
    try {
      await api.syncFeed(feedId);
      await onChange();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFeedId(null);
    }
  }

  async function handleDeleteFeed(feedId) {
    if (!confirm('Rimuovere questo collegamento iCal?')) return;
    try {
      await api.deleteFeed(feedId);
      await onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="property-card">
      <div className="page-header">
        <div>
          <h3>{property.name}</h3>
          {property.address && <p className="muted">{property.address}</p>}
        </div>
        <button className="btn-link btn-link-danger" onClick={onDelete}>Elimina struttura</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <ul className="feed-list">
        {property.feeds.map((f) => (
          <li key={f.id} className="feed-item">
            <PlatformBadge platform={f.platform} />
            <span className="feed-url" title={f.url}>{f.url}</span>
            <span className={`feed-status feed-status-${f.last_sync_status || 'pending'}`}>
              {f.last_sync_status === 'ok' && `✓ sincronizzato`}
              {f.last_sync_status === 'error' && `⚠ errore`}
              {!f.last_sync_status && 'mai sincronizzato'}
            </span>
            <button className="btn-link" disabled={busyFeedId === f.id} onClick={() => handleSyncFeed(f.id)}>
              {busyFeedId === f.id ? 'Sincronizzo…' : 'Sincronizza'}
            </button>
            <button className="btn-link btn-link-danger" onClick={() => handleDeleteFeed(f.id)}>Rimuovi</button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddFeed} className="form form-inline">
        <select value={feedForm.platform} onChange={(e) => setFeedForm((f) => ({ ...f, platform: e.target.value }))}>
          <option value="airbnb">Airbnb</option>
          <option value="booking">Booking.com</option>
          <option value="other">Altro</option>
        </select>
        <input
          type="url"
          placeholder="Incolla qui il link iCal (.ics)"
          value={feedForm.url}
          onChange={(e) => setFeedForm((f) => ({ ...f, url: e.target.value }))}
          required
        />
        <button className="btn btn-secondary" type="submit" disabled={adding}>+ Collega calendario</button>
      </form>
    </div>
  );
}
