# CollabHub

A real-time collaboration platform backend — team chat, live notifications,
direct messages, and presence tracking, built with Node.js, Express, MongoDB, and Socket.IO.

## Planned Features
- User authentication (JWT)
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

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | API status |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/users/me` | Get logged-in user's profile (protected) |
| PUT | `/api/users/me` | Update logged-in user's profile (protected) |
| POST | `/api/workspaces` | Create a new workspace (protected) |
| GET | `/api/workspaces` | Get all workspaces the user belongs to (protected) |
| GET | `/api/workspaces/:id` | Get a single workspace by ID (protected) |
| POST | `/api/workspaces/join` | Join a workspace via invite code (protected) |
| POST | `/api/workspaces/:workspaceId/channels` | Create a channel in a workspace (protected) |
| GET | `/api/workspaces/:workspaceId/channels` | List channels in a workspace (protected) |
| DELETE | `/api/workspaces/:workspaceId/channels/:channelId` | Delete a channel (creator/admin only) (protected) |
| GET | `/api/messages/:workspaceId?channel=general&limit=30&before=<id>` | Get paginated chat history for a channel (protected) |
| GET | `/api/notifications?limit=20&before=<id>` | Get paginated notifications (protected) |
| PUT | `/api/notifications/:id/read` | Mark one notification as read (protected) |
| PUT | `/api/notifications/read-all` | Mark all notifications as read (protected) |
| GET | `/api/dm/conversations` | List all DM conversations (protected) |
| GET | `/api/dm/:userId?limit=30&before=<id>` | Get paginated DM history with a user (protected) |
| POST | `/api/dm/:userId` | Send a direct message (protected) |

## Socket.IO Events
| Event (client → server) | Payload | Description |
|--------------------------|---------|--------------|
| `joinChannel` | `{ workspaceId, channel }` | Join a workspace channel room |
| `leaveChannel` | `{ workspaceId, channel }` | Leave a channel room |
| `sendMessage` | `{ workspaceId, channel, content }` | Send & persist a chat message |
| `editMessage` | `{ messageId, content }` | Edit your own message |
| `deleteMessage` | `{ messageId }` | Soft-delete your own message |
| `typing` | `{ workspaceId, channel }` | Notify others user is typing |

| Event (server → client) | Payload | Description |
|--------------------------|---------|--------------|
| `newMessage` | message object | Broadcast when a message is sent |
| `messageEdited` | message object | Broadcast when a message is edited |
| `messageDeleted` | `{ _id, channel }` | Broadcast when a message is deleted |
| `userTyping` | `{ userId, name }` | Someone is typing |
| `newNotification` | notification object | Sent directly to a user (workspace joins, mentions) |
| `presenceUpdate` | `{ userId, status }` | A workspace member went online/offline |
| `errorMessage` | `{ message }` | Something went wrong |

Connect with a JWT: `io(url, { auth: { token: "<jwt>" } })`

Mention a teammate in a message with `@firstname` (e.g. `"hey @priya check this"`) to trigger a real-time notification to them.

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
