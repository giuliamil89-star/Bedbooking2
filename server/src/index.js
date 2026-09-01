require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const propertiesRouter = require('./routes/properties');
const bookingsRouter = require('./routes/bookings');
const syncRouter = require('./routes/sync');
const { syncAllFeeds } = require('./icalSync');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/properties', propertiesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/sync', syncRouter);

// Serve the built React client in production, if present.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`BedBooking2 API in ascolto su http://localhost:${PORT}`);
});

// Sincronizza automaticamente tutti i feed iCal ogni 30 minuti, così gli
// arrivi restano aggiornati senza bisogno di premere "Sincronizza".
cron.schedule('*/30 * * * *', () => {
  syncAllFeeds().catch((err) => console.error('Sincronizzazione automatica fallita', err));
});
