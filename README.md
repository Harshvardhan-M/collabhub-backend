# CollabHub

A real-time collaboration platform backend — team chat, live notifications,
direct messages, and presence tracking, built with Node.js, Express, MongoDB, and Socket.IO.

## Planned Features
- User authentication (JWT, with refresh tokens)
- Workspaces & teams
- Real-time chat (Socket.IO)
- Live notifications
- Direct messages
- Role-based access control
- Activity feed

## Tech Stack
Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT

## Status
🚧 In active development — building daily as part of a college project.

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
The server validates required environment variables (like `JWT_SECRET`) on startup and
exits immediately with a clear error if any are missing — check `.env.example` for the full list.

## Run with Docker
No local Node.js or MongoDB install needed — this spins up the API and MongoDB together:
```bash
npm run docker:up    # or: docker compose up --build
```
The API will be live at `http://localhost:5000`. Stop everything with:
```bash
npm run docker:down
```

## Code Quality
```bash
npm run lint    # check for issues
npm run format  # auto-format with Prettier
```

## Testing
Integration tests use Jest + Supertest against an in-memory MongoDB (no real DB needed):
```bash
npm test
```

## API Docs
Interactive Swagger UI is available at `/api-docs` once the server is running
(e.g. `http://localhost:5000/api-docs`).

## Authentication
Login/register return an `accessToken` (15 min expiry) and a `refreshToken` (7 day expiry,
stored server-side, single-use/rotated). Use the access token as a Bearer token on protected
routes; when it expires, call `/api/auth/refresh` with the refresh token to get a new pair.
Call `/api/auth/logout` to revoke a refresh token.

Forgot password: `/api/auth/forgot-password` emails a reset link (valid 30 minutes, single-use).
If SMTP isn't configured (see `.env.example`), the email is logged to the console instead of
sent — handy for local development. `/api/auth/reset-password` completes the reset and revokes
all existing sessions for that user.

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | API status |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns access + refresh token |
| POST | `/api/auth/refresh` | Exchange a refresh token for a new pair |
| POST | `/api/auth/logout` | Revoke a refresh token |
| POST | `/api/auth/forgot-password` | Request a password reset email |
| POST | `/api/auth/reset-password` | Reset password with a valid token (revokes all sessions) |
| GET | `/api/users/me` | Get logged-in user's profile (protected) |
| PUT | `/api/users/me` | Update logged-in user's profile (protected) |
| GET | `/api/users/search?q=&limit=` | Search users by name/email — e.g. to start a DM (protected) |
| POST | `/api/workspaces` | Create a new workspace (protected) |
| GET | `/api/workspaces` | Get all workspaces the user belongs to (protected) |
| GET | `/api/workspaces/:id` | Get a single workspace by ID (protected) |
| POST | `/api/workspaces/join` | Join a workspace via invite code (protected) |
| PUT | `/api/workspaces/:id/members/:userId/role` | Promote/demote a member — admin only (protected) |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove a member — admin, or self-removal (protected) |
| POST | `/api/workspaces/:workspaceId/channels` | Create a channel in a workspace (protected) |
| GET | `/api/workspaces/:workspaceId/channels` | List channels in a workspace, each with `unreadCount` (protected) |
| DELETE | `/api/workspaces/:workspaceId/channels/:channelId` | Delete a channel (creator/admin only) (protected) |
| PUT | `/api/workspaces/:workspaceId/channels/:channelName/read` | Mark a channel as read (protected) |
| GET | `/api/messages/:workspaceId?channel=general&limit=30&before=<id>` | Get paginated chat history for a channel (protected) |
| GET | `/api/messages/:workspaceId/search?q=&channel=&limit=` | Full-text search messages in a workspace (protected) |
| GET | `/api/messages/:workspaceId/pinned?channel=` | List pinned messages (protected) |
| GET | `/api/notifications?limit=20&before=<id>` | Get paginated notifications (protected) |
| GET | `/api/notifications/unread-count` | Get total unread notification count (protected) |
| PUT | `/api/notifications/:id/read` | Mark one notification as read (protected) |
| PUT | `/api/notifications/read-all` | Mark all notifications as read (protected) |
| GET | `/api/dm/conversations` | List all DM conversations, each with `unreadCount` (protected) |
| GET | `/api/dm/unread-count` | Get total unread DM count across all conversations (protected) |
| GET | `/api/dm/:userId?limit=30&before=<id>` | Get paginated DM history with a user — marks their messages as read (protected) |
| POST | `/api/dm/:userId` | Send a direct message (protected) |
| PUT | `/api/dm/:userId/read` | Explicitly mark a conversation as read (protected) |
| POST | `/api/uploads` | Upload a file (image/PDF/etc, max 5MB), returns a URL (protected) |

## Socket.IO Events
| Event (client → server) | Payload | Description |
|--------------------------|---------|--------------|
| `joinChannel` | `{ workspaceId, channel }` | Join a workspace channel room (auto-marks it read) |
| `leaveChannel` | `{ workspaceId, channel }` | Leave a channel room |
| `sendMessage` | `{ workspaceId, channel, content, attachment? }` | Send & persist a chat message — `content` alone, `attachment` alone, or both |
| `editMessage` | `{ messageId, content }` | Edit your own message |
| `deleteMessage` | `{ messageId }` | Soft-delete your own message |
| `toggleReaction` | `{ messageId, emoji }` | Add/remove your reaction on a message |
| `togglePin` | `{ messageId }` | Pin/unpin a message — admin only |
| `typing` | `{ workspaceId, channel }` | Notify others user is typing |

| Event (server → client) | Payload | Description |
|--------------------------|---------|--------------|
| `newMessage` | message object | Broadcast when a message is sent |
| `messageEdited` | message object | Broadcast when a message is edited |
| `messageDeleted` | `{ _id, channel }` | Broadcast when a message is deleted |
| `reactionUpdated` | `{ messageId, channel, reactions }` | Broadcast when a reaction is added/removed |
| `pinUpdated` | `{ messageId, channel, pinned }` | Broadcast when a message is pinned/unpinned |
| `userTyping` | `{ userId, name }` | Someone is typing |
| `newNotification` | notification object | Sent directly to a user (workspace joins, mentions) |
| `presenceUpdate` | `{ userId, status }` | A workspace member went online/offline |
| `errorMessage` | `{ message }` | Something went wrong |

Connect with a JWT access token: `io(url, { auth: { token: "<accessToken>" } })`

Mention a teammate in a message with `@firstname` (e.g. `"hey @priya check this"`) to trigger a real-time notification to them.

## File Uploads
`POST /api/uploads` (multipart/form-data, field name `file`) accepts images, PDFs, plain text,
and zip files up to 5MB, saved to local disk under `/uploads` and served statically. Upload a
file first to get back `{ url, filename, mimetype, size }`, then send it as a chat message by
including that as the `attachment` field in the `sendMessage` socket event. In Docker, uploaded
files persist in a named volume (`uploads-data`) so they survive container restarts.

## Progress Log
- **Day 1**: Project setup, Express server skeleton, health check endpoint
- **Day 2**: Code quality tooling — ESLint + Prettier configured, `npm run lint` / `npm run format` scripts, linting added as a CI step
- **Day 3**: User model with password hashing (bcrypt), JWT-based register & login endpoints
- **Day 4**: Auth middleware (`protect`) to guard private routes, profile get/update endpoints
- **Day 5**: Workspace model, create/join/list workspaces, invite-code-based membership
- **Day 6**: Real-time chat via Socket.IO (JWT-authenticated sockets, rooms per workspace/channel), message persistence + history endpoint
- **Day 7**: Notification system — model, REST endpoints (list/mark read), and real-time delivery via personal socket rooms; triggered on workspace joins
- **Day 8**: Centralized error handling (`AppError`, global `errorHandler`, `notFound`), async wrapper util, and request validation (`express-validator`) on auth & workspace routes
- **Day 9**: Channel model + CRUD (nested under workspaces), auto-created default `#general` channel on workspace creation
- **Day 10**: Chat now validates channels against real DB records (not a trusted string), plus `@mention` parsing that triggers real-time notifications to mentioned teammates
- **Day 11**: Automated integration tests (Jest + Supertest + in-memory MongoDB) covering auth and workspace flows
- **Day 12**: Rate limiting (strict on `/api/auth`, general on all `/api` routes) to prevent brute-force/abuse, plus NoSQL injection sanitization on all incoming input
- **Day 13**: Interactive API documentation with Swagger/OpenAPI, served at `/api-docs`, covering every route
- **Day 14**: GitHub Actions CI — runs the test suite on Node 18.x & 20.x on every push/PR, plus a smoke test that boots the server and hits `/api/health`
- **Day 15**: Direct messages (1:1) — `Conversation` + `DirectMessage` models, REST endpoints to list conversations, send, and fetch history
- **Day 16**: Real-time presence tracking — a user's `status` (online/offline) updates automatically on socket connect/disconnect (multi-tab safe) and broadcasts to everyone in their workspaces
- **Day 17**: Message editing & soft-deletion — sender-only `editMessage`/`deleteMessage` socket events, `edited`/`deleted` flags on the `Message` model, broadcast to the whole channel
- **Day 18**: Cursor-based pagination on message history, DM history, and notifications (`?limit=&before=`), returning `{ items, hasMore, nextCursor }` instead of a flat capped list
- **Day 19**: Workspace member management — admin-only promote/demote, admin (or self) removal, with the owner protected from being demoted or removed; covered by new tests
- **Day 20**: Search — full-text message search within a workspace (MongoDB text index, relevance-ranked, optionally scoped to a channel) and user search by name/email (regex-escaped, for finding people to DM)
- **Day 21**: Docker support — multi-stage `Dockerfile` (non-root user), `docker-compose.yml` running the API alongside MongoDB, `npm run docker:up`/`docker:down`, and a CI job that verifies the image builds on every push
- **Day 22**: Startup environment validation — the server now checks required vars (`JWT_SECRET`, and `MONGO_URI` in production) and exits with a clear error instead of failing confusingly later, plus warnings for a weak `JWT_SECRET` or missing `CLIENT_URL` in production
- **Day 23**: Unread counts & read receipts — DM conversations now report `unreadCount`, viewing a conversation marks it read, plus `/api/dm/unread-count` and `/api/notifications/unread-count` endpoints; covered by new tests
- **Day 24**: Unread counts for workspace channels — new `ChannelRead` model tracks last-read time per user per channel, channel list now reports `unreadCount`, marked as read via REST or automatically when joining a channel over Socket.IO
- **Day 25**: Message reactions — `reactions` field on `Message` (emoji → users who reacted), toggled in real time via the `toggleReaction` socket event, included in the message history endpoint
- **Day 26**: Refresh tokens & logout — access tokens now expire in 15 minutes; a revocable, single-use (rotated), TTL-indexed `RefreshToken` handles session renewal via `/api/auth/refresh`, and `/api/auth/logout` revokes it
- **Day 27**: Password reset flow — `forgot-password`/`reset-password` endpoints, hashed single-use TTL tokens (30 min), account-enumeration-safe responses, resetting a password revokes all existing sessions; emails log to console when SMTP isn't configured
- **Day 28**: File/image attachments — `POST /api/uploads` (Multer, disk storage, 5MB limit, MIME allowlist) returns a URL; chat messages can now carry an `attachment` alongside or instead of text, served statically and persisted via a Docker volume
- **Day 29**: Pinned messages — admin-only `togglePin` socket event, `pinned` flag on `Message`, `GET /api/messages/:workspaceId/pinned` to list them, broadcast via `pinUpdated`
- **Day 30**: Structured request logging — every request gets a UUID (`X-Request-Id` header), included in error responses; logs are JSON in production and human-readable in development, for tracing a request across logs
