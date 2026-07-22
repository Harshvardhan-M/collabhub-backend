# CollabHub

A real-time collaboration platform backend — team chat, live notifications,
and presence tracking, built with Node.js, Express, MongoDB, and Socket.IO.

## Planned Features
- User authentication (JWT)
- Workspaces & teams
- Real-time chat (Socket.IO)
- Live notifications
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
| GET | `/api/messages/:workspaceId?channel=general` | Get chat history for a channel (protected) |
| GET | `/api/notifications` | Get logged-in user's notifications (protected) |
| PUT | `/api/notifications/:id/read` | Mark one notification as read (protected) |
| PUT | `/api/notifications/read-all` | Mark all notifications as read (protected) |

## Socket.IO Events
| Event (client → server) | Payload | Description |
|--------------------------|---------|--------------|
| `joinChannel` | `{ workspaceId, channel }` | Join a workspace channel room |
| `leaveChannel` | `{ workspaceId, channel }` | Leave a channel room |
| `sendMessage` | `{ workspaceId, channel, content }` | Send & persist a chat message |
| `typing` | `{ workspaceId, channel }` | Notify others user is typing |

| Event (server → client) | Payload | Description |
|--------------------------|---------|--------------|
| `newMessage` | message object | Broadcast when a message is sent |
| `userTyping` | `{ userId, name }` | Someone is typing |
| `newNotification` | notification object | Sent directly to a user (e.g. someone joined their workspace) |
| `errorMessage` | `{ message }` | Something went wrong |

Connect with a JWT: `io(url, { auth: { token: "<jwt>" } })`

## Progress Log
- **Day 1**: Project setup, Express server skeleton, health check endpoint
- **Day 3**: User model with password hashing (bcrypt), JWT-based register & login endpoints
- **Day 4**: Auth middleware (`protect`) to guard private routes, profile get/update endpoints
- **Day 5**: Workspace model, create/join/list workspaces, invite-code-based membership
- **Day 6**: Real-time chat via Socket.IO (JWT-authenticated sockets, rooms per workspace/channel), message persistence + history endpoint
- **Day 7**: Notification system — model, REST endpoints (list/mark read), and real-time delivery via personal socket rooms; triggered on workspace joins
