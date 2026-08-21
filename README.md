<div align="center">

# 🎨 MergeCanvas

**A real-time collaborative whiteboard for teams**

Draw, sketch, and brainstorm together — live cursors, CRDT-based sync, and persistent rooms.

[![CI](https://github.com/Sumit-y88/Merge-canvas/actions/workflows/ci.yml/badge.svg)](https://github.com/Sumit-y88/Merge-canvas/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](#license)
[![Node](https://img.shields.io/badge/node-20%2B-339933?logo=node.js&logoColor=white)](#tech-stack)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#tech-stack)

[**Live App**](https://merge-canvas.vercel.app/) · [**API**](https://merge-canvas.onrender.com) · [Report a Bug](https://github.com/Sumit-y88/Merge-canvas/issues) · [Request a Feature](https://github.com/Sumit-y88/Merge-canvas/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Realtime Events (Socket.IO)](#realtime-events-socketio)
- [Deployment](#deployment)
  - [Docker (self-hosted)](#docker-self-hosted)
  - [Hosted (Vercel + Render)](#hosted-vercel--render)
- [Production Hardening](#production-hardening)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**MergeCanvas** is a full-stack, real-time collaborative whiteboard application. Multiple users can join a shared "room," draw and edit shapes simultaneously, and see each other's cursors move live — similar in spirit to Figma or Excalidraw's multiplayer mode.

Under the hood, canvas state is modeled as a **Yjs CRDT document**, synced over **Socket.IO**, and durably persisted to **MongoDB**. Authentication supports both classic email/password and **Google Sign-In**, with short-lived JWT access tokens and rotating refresh tokens.

## Features

- 🖊️ **Drawing tools** — select, freehand pen, rectangle, ellipse, line, arrow, text, sticky notes, and eraser, each with dedicated keyboard shortcuts
- 🎨 **Style controls** — stroke/fill color, stroke width, sticky-note color palette, and snap-to-grid
- 🧩 **Ready-made templates** for quickly starting a board
- 👥 **Live multiplayer** — real-time cursors, presence (`join`/`leave`) events, and conflict-free concurrent edits via Yjs
- 🔐 **Authentication** — email/password signup & login, Google OAuth sign-in, JWT access tokens + rotating refresh tokens, and server-side token blacklisting on logout
- 🏠 **Rooms & permissions** — create/join rooms via invite codes, `owner` / `editor` / `viewer` roles, public or private rooms, and per-collaborator role management
- 💾 **Persistence** — canvas snapshots and Yjs state saved to MongoDB, restored automatically when a room is reopened
- 🖼️ **Export** — download the board as an image
- 🌓 **Light/Dark theme** toggle
- 📊 **Undo / redo**, zoom, and a full canvas history stack
- 🩺 **Health checks** and structured JSON logging for production observability
- 🛡️ **Hardened by default** — rate limiting, security headers, payload-size limits, and origin allow-listing

## Live Demo

| Service | URL |
|---|---|
| 🌐 Client (Vercel) | **https://merge-canvas.vercel.app/** |
| ⚙️ API / Socket.IO server (Render) | **https://merge-canvas.onrender.com** |

> **Note:** The API is hosted on Render's free tier, which spins down when idle. The first request after a period of inactivity may take up to ~50 seconds to wake the server.

## Tech Stack

**Client**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/) for client-side routing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [GSAP](https://gsap.com/) for animation
- [Yjs](https://docs.yjs.dev/) client-side CRDT document
- [Socket.IO Client](https://socket.io/) for realtime transport
- [Axios](https://axios-http.com/) for REST calls
- [Lucide React](https://lucide.dev/) icon set

**Server**
- [Node.js 20](https://nodejs.org/) + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/) (with optional [Redis adapter](https://socket.io/docs/v4/redis-adapter/) for horizontal scaling)
- [Yjs](https://docs.yjs.dev/) for CRDT canvas synchronization
- [JWT](https://github.com/auth0/node-jsonwebtoken) (access + refresh tokens) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for auth
- [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs) for Google Sign-In verification
- [ioredis](https://github.com/redis/ioredis) for distributed rate limiting and the Socket.IO adapter

**Infrastructure**
- Docker & Docker Compose (production stack: client + server + MongoDB + Redis + Nginx)
- Nginx as a TLS-terminating reverse proxy in front of the API
- GitHub Actions CI (lint, build, and test on every push/PR)
- Deployed today via **Vercel** (client) and **Render** (API)

## Architecture

```
┌──────────────┐        HTTPS (REST)        ┌────────────────────┐
│              │ ─────────────────────────▶ │                    │
│   React      │                             │   Express API      │
│   Client     │        WSS (Socket.IO)      │   (Auth + Rooms)    │
│  (Vercel)    │ ◀────────────────────────▶ │   (Render)          │
│              │                             │                    │
└──────────────┘                             └─────────┬──────────┘
                                                        │
                                     ┌──────────────────┼──────────────────┐
                                     ▼                  ▼                  ▼
                               ┌──────────┐      ┌────────────┐    ┌──────────────┐
                               │ MongoDB  │      │   Redis    │    │  Yjs Doc     │
                               │ (rooms,  │      │ (rate      │    │  in-memory   │
                               │  users,  │      │  limiter + │    │  cache per   │
                               │  tokens) │      │  socket    │    │  room, synced│
                               │          │      │  adapter)  │    │  to Mongo    │
                               └──────────┘      └────────────┘    └──────────────┘
```

- **Client** — renders the canvas, sends/receives Yjs updates and cursor positions over Socket.IO, and calls the REST API for auth/room management.
- **API** — Express REST endpoints for authentication and room CRUD, protected by JWT middleware.
- **Realtime** — Socket.IO handles room join/leave, presence, live cursor broadcasting, and Yjs update propagation. Updates are serialized per-room to avoid write races and periodically persisted to MongoDB.
- **Persistence** — MongoDB stores users, refresh tokens, rooms (collaborators, invite codes, roles), and both the Yjs binary state and a plain-JSON canvas snapshot for fast initial loads.
- **Horizontal scaling** — when `REDIS_URL` is set, Socket.IO uses the Redis adapter so events fan out correctly across multiple API instances, and the auth rate limiter becomes a shared, distributed limiter instead of a per-process one.

## Project Structure

```
Merge-canvas/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/                 # Axios REST clients + Socket.IO client setup
│   │   ├── components/
│   │   │   ├── canvas/          # Canvas, Toolbar, Templates, Shortcuts modal
│   │   │   └── ui/              # Shared UI primitives
│   │   ├── context/             # Auth & Theme React contexts
│   │   ├── hooks/                # useAuth, useTheme, animation hooks
│   │   ├── lib/                  # utils + Yjs <-> canvas bridge
│   │   └── pages/                # Landing, Login, Signup, Dashboard, Profile, Whiteboard
│   ├── tests/
│   ├── Dockerfile
│   └── ops/                     # nginx config for the client image
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/               # MongoDB connection
│   │   ├── controllers/          # Auth + Room HTTP handlers
│   │   ├── middleware/           # JWT auth guard, security headers, rate limiter
│   │   ├── models/                # User, Room, RefreshToken, TokenBlacklist
│   │   ├── realtime/              # Socket.IO server + Yjs room store
│   │   ├── routes/                # /api/auth, /api/rooms
│   │   ├── services/              # Business logic layer
│   │   └── utils/                 # Token utils, logger, payload validation
│   ├── tests/                    # Integration tests (API, realtime, permissions)
│   └── Dockerfile
├── ops/
│   └── backup-mongodb.ps1        # Scheduled MongoDB backup script
├── docker-compose.production.yml # Full production stack (client, server, mongo, redis)
└── .github/workflows/ci.yml      # Lint, build, and test pipeline
```

## Getting Started

### Prerequisites

- **Node.js 20+**
- **MongoDB** (local instance or a connection string to a managed cluster)
- **npm**
- *(Optional)* **Redis** — only needed to test distributed rate limiting / multi-instance Socket.IO locally
- *(Optional)* A **Google OAuth Client ID** — only needed to test "Sign in with Google"

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Sumit-y88/Merge-canvas.git
cd Merge-canvas

# 2. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# then edit server/.env and set a strong JWT_SECRET (see below)

# 3. Install dependencies
npm install --prefix server
npm install --prefix client

# 4. Run the API and client in separate terminals
npm run dev --prefix server     # http://localhost:5000
npm run dev --prefix client     # http://localhost:5173
```

Once both are running, open **http://localhost:5173** in your browser.

### Environment Variables

**`server/.env`**

| Variable | Description | Default / Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/mergeCanvas` |
| `PORT` | API server port | `5000` |
| `CLIENT_URL` | Comma-separated list of allowed CORS origins (the deployed client origin is always included) | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID used to verify Google Sign-In tokens | `your-client-id.apps.googleusercontent.com` |
| `JWT_SECRET` | Secret used to sign JWTs — **must be a long, random value in production** | `replace-with-a-long-random-secret` |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_DAYS` | Refresh token lifetime, in days | `7` |
| `NODE_ENV` | `development`, `production`, or `test` | `development` |
| `REDIS_URL` | Enables the distributed rate limiter and the Socket.IO Redis adapter when set | `redis://localhost:6379` |
| `MAX_BODY_SIZE` | Max JSON body size accepted by Express | `8mb` |
| `MAX_CANVAS_BYTES` | Max size of a persisted canvas payload | `8388608` |
| `MAX_CANVAS_ELEMENTS` | Max number of elements per canvas | `5000` |
| `MAX_IMAGE_BYTES` | Max size of an embedded image element | `2097152` |
| `MAX_FREEHAND_POINTS` | Max points allowed in a single freehand stroke | `10000` |
| `YJS_ROOM_CACHE_TTL_MS` | How long an idle Yjs room doc stays cached in memory | `1800000` |
| `MAX_CACHED_YJS_ROOMS` | Max number of Yjs room docs cached in memory at once | `1000` |

**`client/.env`**

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the REST API | `http://localhost:5000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (must match the server's) | `your-client-id.apps.googleusercontent.com` |

## Available Scripts

**Client** (run with `--prefix client` or from inside `client/`)

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `client/dist` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run client unit tests |

**Server** (run with `--prefix server` or from inside `server/`)

| Script | Description |
|---|---|
| `npm run dev` | Start the API with `nodemon` (auto-restart) |
| `npm start` | Start the API for production (`node src/index.js`) |
| `npm test` | Run integration tests (API, realtime, room permissions) |

### Verification (matches CI)

```bash
npm run lint --prefix client
npm run build --prefix client
npm test --prefix server
```

## API Overview

Base URL: `VITE_API_URL` (e.g. `https://merge-canvas.onrender.com/api`)

**Health**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Returns `200 { status: "ok" }` once MongoDB is connected, `503` otherwise. Used for deployment health checks. |

**Auth** — `/api/auth` *(rate-limited)*

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | – | Create an account with name, email, and password |
| `POST` | `/login` | – | Log in with email and password |
| `POST` | `/google` | – | Sign in / sign up via a Google ID token |
| `POST` | `/refresh` | – | Exchange a valid refresh token for a new access token |
| `POST` | `/logout` | – | Revoke the current refresh token / blacklist the access token |
| `GET` | `/profile` | JWT | Get the authenticated user's profile |
| `PATCH` | `/profile` | JWT | Update profile fields (e.g. name) |
| `PATCH` | `/profile/password` | JWT | Change password |

**Rooms** — `/api/rooms` *(all routes require a valid JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create a new room |
| `GET` | `/` | List rooms the current user belongs to |
| `GET` | `/:id` | Get a single room's details |
| `POST` | `/join` | Join a room via its invite code |
| `PUT` | `/:id/canvas` | Persist a canvas snapshot |
| `PATCH` | `/:id` | Update room settings (name, visibility, default join role) |
| `POST` | `/:id/invite/regenerate` | Rotate the room's invite code |
| `POST` | `/:id/leave` | Leave a room |
| `DELETE` | `/:id` | Delete a room (owner only) |
| `PATCH` | `/:id/collaborators/:userId/role` | Change a collaborator's role (`owner` / `editor` / `viewer`) |
| `DELETE` | `/:id/collaborators/:userId` | Remove a collaborator from a room |

## Realtime Events (Socket.IO)

The client authenticates the socket handshake with its JWT access token (`socket.handshake.auth.token`).

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:join` | client → server | `roomId` | Join a room's Socket.IO channel; membership is verified server-side |
| `presence:joined` / `presence:left` | server → client | `{ user }` / `{ userId }` | Broadcast when a collaborator joins or leaves |
| `yjs:sync-request` | client → server | `{ roomId, stateVector }` | Request missing Yjs updates when first connecting to a room |
| `yjs:update` | bidirectional | `{ roomId, update }` | Incremental CRDT update, applied and persisted server-side, then rebroadcast |
| `canvas:snapshot` | bidirectional | `{ roomId, canvasData }` | Full canvas snapshot save/broadcast (used for large or non-incremental changes) |
| `cursor:move` / `cursor:update` | bidirectional | `{ roomId, point }` / `{ userId, name, color, point }` | Live cursor broadcasting |
| `canvas:error` | server → client | `{ message }` | Emitted when an update is rejected (e.g. permission denied, payload too large) |

Only users with the `owner` or `editor` role may emit `yjs:update` / `canvas:snapshot`; `viewer`s receive updates read-only. Updates for a given room are processed through a per-room async queue on the server to prevent race conditions when persisting to MongoDB.

## Deployment

### Docker (self-hosted)

The repository ships a full production stack: the API, the client (built and served via Nginx), MongoDB, and Redis.

```bash
# 1. Configure production environment
cp server/.env.example server/.env.production
# set a strong JWT_SECRET, MONGODB_URI, REDIS_URL, and CLIENT_URL

# 2. Add TLS certificates
#    place fullchain.pem and privkey.pem in ops/certs/

# 3. Set your domain and launch
export APP_DOMAIN=your-domain.com
docker compose -f docker-compose.production.yml up -d --build
```

- Port `80` redirects to HTTPS; Nginx proxies `/api` and Socket.IO WebSocket upgrades to the API container.
- Prefer a managed MongoDB instance (e.g. Atlas) over the bundled `mongo` service for production data durability.
- Schedule `ops/backup-mongodb.ps1` (or an equivalent `mongodump` job) daily, ship backups to separate durable storage, encrypt them, and periodically test restoration.

### Hosted (Vercel + Render)

This project's live deployment uses a split-hosting model:

- **Client → [Vercel](https://vercel.com/)**: the `client/` app is deployed as a static Vite build, with `VITE_API_URL` pointed at the Render API and `VITE_GOOGLE_CLIENT_ID` configured for the production OAuth client.
- **Server → [Render](https://render.com/)**: the `server/` app is deployed as a Node web service (`npm start`), with `CLIENT_URL` set to `https://merge-canvas.vercel.app`, plus `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and optionally `REDIS_URL` configured as environment variables. Render's health checks can point at `GET /healthz`.

## Production Hardening

- **Distributed rate limiting** — set `REDIS_URL` to enable a shared Redis-backed limiter for authentication endpoints across multiple instances. If Redis is temporarily unreachable, the server automatically falls back to a bounded, process-local limiter and logs the condition — it never fails open.
- **Payload limits** — canvas writes (REST saves and Socket.IO snapshots/Yjs updates) are bounded by `MAX_BODY_SIZE`, `MAX_CANVAS_BYTES`, `MAX_CANVAS_ELEMENTS`, `MAX_IMAGE_BYTES`, and `MAX_FREEHAND_POINTS` to prevent abuse and oversized documents.
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and (in production) `Strict-Transport-Security` are set on every response.
- **Strict CORS** — only the configured `CLIENT_URL` origin(s) may call the API with credentials; all others are rejected.
- **JWT hygiene** — short-lived access tokens, rotating refresh tokens (hashed at rest), and a token blacklist so logout and revocation are enforced immediately, including for active Socket.IO connections.
- **Structured logging** — logs are emitted as JSON to stdout (request latency, status codes, request errors, uncaught exceptions, unhandled rejections) without leaking internal error details to clients. Point your platform's log collector at container stdout/stderr.
- **Horizontal scalability** — the Socket.IO Redis adapter keeps room events consistent across multiple API instances; the Yjs room cache is bounded (`MAX_CACHED_YJS_ROOMS`, `YJS_ROOM_CACHE_TTL_MS`) to control memory usage.

## Testing

```bash
# Server: integration tests for the REST API, Socket.IO realtime layer, and room permissions
npm test --prefix server

# Client: unit tests for utilities and the Yjs <-> canvas bridge
npm test --prefix client
```

Server tests spin up an in-memory MongoDB instance (`mongodb-memory-server`) and a real Socket.IO client (`socket.io-client`) to exercise realtime flows end to end, without requiring an external database.

CI (`.github/workflows/ci.yml`) runs on every push and pull request: it lints and builds the client, and runs the full server test suite.

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, contact the maintainer directly via GitHub.

Notable security-relevant defaults:
- Passwords are hashed with `bcryptjs` and never returned from queries by default (`select: false`).
- Google Sign-In tokens are verified server-side against `GOOGLE_CLIENT_ID` via `google-auth-library`.
- Refresh tokens are stored hashed, with TTL-based expiry indexes in MongoDB.
- Room membership and role are re-verified on the server for every realtime edit — the client's UI state is never trusted for authorization.

## Roadmap

- [ ] Room thumbnails on the dashboard
- [ ] Shareable read-only public links
- [ ] Additional export formats (SVG / PDF)
- [ ] Mobile/touch-optimized canvas interactions

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and add/update tests
4. Ensure `npm run lint --prefix client`, `npm run build --prefix client`, and `npm test --prefix server` all pass
5. Open a pull request describing your changes

## License

Distributed under the **ISC License**. See `server/package.json` for license metadata, or add a `LICENSE` file at the repository root to make this explicit.

---

<div align="center">

Built by [Sumit Yadav](https://github.com/Sumit-y88)

</div>
