# Build del frontend
FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Immagine finale: solo il backend, che serve anche il frontend già compilato
FROM node:22-slim
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist ../client/dist

ENV PORT=4000
EXPOSE 4000
# Il database SQLite vive qui: monta un volume persistente su questo path
# sulla piattaforma di hosting, altrimenti i dati si perdono ad ogni deploy.
VOLUME ["/app/server/data"]

CMD ["node", "src/index.js"]
