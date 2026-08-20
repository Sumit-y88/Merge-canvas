# MergeCanvas

MergeCanvas is a collaborative whiteboard with React/Vite on the client and Express, MongoDB, Socket.IO, and Yjs on the server.

## Local setup

Requirements: Node.js 20+, MongoDB, and npm.

1. Copy `server/.env.example` to `server/.env` and set a strong `JWT_SECRET`.
2. Copy `client/.env.example` to `client/.env`.
3. Install dependencies:

   ```powershell
   npm install --prefix server
   npm install --prefix client
   ```

4. Start the API and client in separate terminals:

   ```powershell
   npm run dev --prefix server
   npm run dev --prefix client
   ```

The client runs at `http://localhost:5173`; the API and Socket.IO server run at `http://localhost:5000`.

## Verification

```powershell
npm run lint --prefix client
npm run build --prefix client
npm test --prefix server
```

The server exposes `GET /healthz` for deployment health checks. In production, set `NODE_ENV=production`, use HTTPS, configure `CLIENT_URL` with the deployed client origin, and use a managed MongoDB connection string.

## Architecture

- Client: React, React Router, Tailwind CSS, HTML canvas
- API: Express REST endpoints for authentication and rooms
- Realtime: Socket.IO transport with Yjs document synchronization
- Persistence: MongoDB room, user, refresh-token, and Yjs state documents

The in-memory authentication rate limiter is suitable for a single server instance. Multi-instance deployments should replace it with a shared store such as Redis.

## Production hardening

Set `REDIS_URL` in `server/.env.production` to enable the distributed authentication rate limiter. If Redis is temporarily unavailable, the server falls back to a bounded process-local limiter and logs the condition.

Canvas requests are limited by `MAX_BODY_SIZE`, `MAX_CANVAS_BYTES`, `MAX_CANVAS_ELEMENTS`, `MAX_IMAGE_BYTES`, and `MAX_FREEHAND_POINTS`. These limits apply to REST saves and Socket.IO snapshots/Yjs updates.

Application logs are emitted as JSON to stdout. Send container stdout/stderr to the platform log collector. The server logs request latency, status codes, request errors, uncaught exceptions, and unhandled rejections without returning internal error details to clients.

For a Docker deployment, copy `server/.env.example` to `server/.env.production`, set a strong secret, database URL, Redis URL, and `CLIENT_URL`, place TLS certificates in `ops/certs/fullchain.pem` and `ops/certs/privkey.pem`, set `APP_DOMAIN`, and run:

```powershell
docker compose -f docker-compose.production.yml up -d --build
```

Port 80 redirects to HTTPS; Nginx proxies `/api` and Socket.IO upgrades to the API container. Use a managed MongoDB instance for production when possible. Schedule `ops/backup-mongodb.ps1` (or an equivalent `mongodump` job) daily, copy backups to separate durable storage, encrypt them, and periodically test restoration.
