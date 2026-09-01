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

## Pubblicarla online e installarla su Android

L'app è una **PWA (Progressive Web App)**: una volta pubblicata online con
HTTPS, si installa su Android direttamente da Chrome, con icona propria e
senza passare dal Play Store.

### 1. Pubblica il backend online

Il modo più semplice è [Render](https://render.com) (dashboard web, nessun
comando da terminale):

1. Crea un account su Render e collega il tuo repository GitHub.
2. **New +** → **Blueprint**, seleziona questo repository: Render legge
   automaticamente `render.yaml` e propone un servizio Docker già
   configurato (build da `Dockerfile`, porta 4000, disco persistente da 1GB
   per il database in `/app/server/data`).
3. Conferma la creazione. Il piano **Starter** (~7$/mese) è necessario
   perché include il disco persistente: senza di esso le prenotazioni
   andrebbero perse ad ogni riavvio del servizio — sconsigliato per dati
   reali come le prenotazioni degli ospiti.
4. Al termine del deploy, Render fornisce un URL pubblico HTTPS del tipo
   `https://bedbooking2.onrender.com` — è il link della tua app, apribile
   da qualsiasi dispositivo.

Alternative equivalenti (stesso `Dockerfile`, adattando il deploy alla
piattaforma): [Railway](https://railway.app), [Fly.io](https://fly.io).

### 2. Installa l'app sul telefono Android

1. Apri l'URL pubblico (es. `https://bedbooking2.onrender.com`) con
   **Chrome** su Android.
2. Chrome mostra in automatico il banner **"Installa app"** (o **"Aggiungi
   a schermata Home"** nel menu ⋮ in alto a destra se non compare da solo).
3. Conferma: l'icona di BedBooking2 compare sulla schermata Home e si apre
   a schermo intero, come un'app nativa — senza barra degli indirizzi.

Da quel momento l'app sul telefono parla con lo stesso backend online: le
prenotazioni inserite o sincronizzate da un dispositivo sono visibili
subito anche dagli altri.

> Vuoi invece distribuirla tramite Play Store (icona ufficiale, ricerca
> nello store)? È possibile impacchettando questa stessa PWA come *Trusted
> Web Activity* con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
> o [PWABuilder](https://www.pwabuilder.com/): richiede un account
> sviluppatore Google Play (25$ una tantum) e la revisione di Google. Fammi
> sapere se vuoi che prepari anche questa parte.

## Configurazione

Copia `server/.env.example` in `server/.env` per personalizzare porta e
percorso del database, se necessario.

## Note

- Il database SQLite viene creato automaticamente in `server/data/` al
  primo avvio e non è incluso nel repository.
- Booking.com in molti casi non include il nome dell'ospite nel calendario
  iCal per motivi di privacy: in quel caso la prenotazione viene importata
  con un nome generico, modificabile a mano.
- L'installazione come PWA richiede HTTPS (soddisfatto automaticamente da
  Render/Railway/Fly.io) e funziona solo online: la schermata dell'app si
  carica anche con connessione debole, ma prenotazioni e sincronizzazione
  richiedono comunque una connessione al backend.
