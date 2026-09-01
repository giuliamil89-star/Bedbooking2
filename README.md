# BedBooking2

App per la gestione delle prenotazioni e degli orari di arrivo dei tuoi
alloggi in affitto, con **sincronizzazione automatica da Airbnb e
Booking.com** tramite calendario iCal e possibilità di aggiungere/modificare
prenotazioni a mano (utile soprattutto per inserire l'orario di arrivo, che
i calendari iCal di solito non forniscono).

## Funzionalità

- **Dashboard arrivi**: elenco degli arrivi di oggi e domani, con modifica
  rapida dell'orario di arrivo.
- **Calendario mensile**: vista d'insieme delle prenotazioni per struttura,
  con indicazione di arrivi/partenze.
- **Elenco prenotazioni**: tabella filtrabile per struttura e piattaforma,
  con creazione/modifica/eliminazione manuale.
- **Gestione strutture multiple**: ogni struttura può avere più calendari
  iCal collegati (uno per Airbnb, uno per Booking.com, ecc.).
- **Sincronizzazione iCal**: import automatico ogni 30 minuti + pulsante di
  sincronizzazione manuale. Le prenotazioni importate che spariscono dal
  calendario esterno vengono marcate come annullate. I campi modificati a
  mano (nome ospite, orario di arrivo, note) non vengono mai sovrascritti
  da una sincronizzazione successiva.

## Stack tecnico

- **Backend**: Node.js + Express + SQLite (`better-sqlite3`), parsing iCal
  con `node-ical`, sincronizzazione periodica con `node-cron`.
- **Frontend**: React + Vite, routing con `react-router-dom`.

## Struttura del progetto

```
server/   API REST + database SQLite + sincronizzazione iCal
client/   applicazione React
```

## Avvio in locale (sviluppo)

Servono due terminali: uno per il backend, uno per il frontend.

```bash
# Terminale 1 — backend (API su http://localhost:4000)
cd server
npm install
npm run dev

# Terminale 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Apri http://localhost:5173 — il frontend inoltra automaticamente le
richieste `/api/*` al backend (vedi `client/vite.config.js`).

## Come collegare Airbnb e Booking.com

1. Vai nella sezione **Strutture** e crea una struttura.
2. Su Airbnb: *Calendario → Disponibilità → Esporta calendario* → copia il
   link `.ics`.
   Su Booking.com: *Extranet → Calendario → Sincronizza i calendari* → copia
   il link iCal della struttura.
3. Nella scheda della struttura, scegli la piattaforma e incolla il link in
   "Collega calendario". La prima sincronizzazione parte subito; le
   successive avvengono automaticamente ogni 30 minuti (o a richiesta con
   "Sincronizza").
4. Le prenotazioni importate compaiono in **Calendario** e **Prenotazioni**;
   apri ciascuna per aggiungere nome ospite (se non fornito), orario di
   arrivo e note.

## Build per la produzione

```bash
cd client && npm run build
cd ../server && npm start
```

Il backend, se trova `client/dist`, serve automaticamente anche il
frontend già compilato sulla stessa porta (quella configurata in
`server/.env`, di default `4000`) — non serve un server separato per il
frontend in produzione.

## Configurazione

Copia `server/.env.example` in `server/.env` per personalizzare porta e
percorso del database, se necessario.

## Note

- Il database SQLite viene creato automaticamente in `server/data/` al
  primo avvio e non è incluso nel repository.
- Booking.com in molti casi non include il nome dell'ospite nel calendario
  iCal per motivi di privacy: in quel caso la prenotazione viene importata
  con un nome generico, modificabile a mano.
