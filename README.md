# Svuota Mente Serale

Mini web app per il "brain dump" serale: scrivi i pensieri che ti affollano
la testa, categorizzali all'istante (Da Fare, Preoccupazione, Idea) e concediti
il permesso di staccare prima di dormire.

Pensata per il micro-target delle mamme lavoratrici in overload mentale:
niente account, niente salvataggio, niente sistema da imparare — solo un
flusso guidato di due minuti che si chiude con un riepilogo copiabile o
inviabile via email.

## Stack

React + Vite + TypeScript + Tailwind CSS + componenti in stile shadcn/ui
(Radix UI sotto il cofano). Nessun backend, nessuna chiamata API, nessun
database: l'app è completamente stateless lato client e pensata per essere
hostata gratis su Vercel o Netlify.

## Sviluppo

```bash
npm install
npm run dev      # avvia il server di sviluppo
npm run build    # type-check + build di produzione in dist/
npm run preview  # serve la build di produzione in locale
npm run lint      # lint con oxlint
```

## Struttura

- `src/components/svuota-mente-serale.tsx` – schermata principale: input,
  categorizzazione guidata, liste dei pensieri, chiusura del ciclo.
- `src/components/riepilogo-dialog.tsx` – dialog di riepilogo finale con
  export (copia negli appunti / `mailto:`).
- `src/components/ui/` – primitive UI in stile shadcn (Button, Input, Card,
  Badge, Dialog).
- `src/lib/riepilogo.ts` – formattazione del riepilogo testuale e del link
  `mailto:`.
- `src/types.ts` – modello dati dei pensieri e configurazione delle
  categorie.
