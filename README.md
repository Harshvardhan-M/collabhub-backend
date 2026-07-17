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

## Progress Log
- **Day 1**: Project setup, Express server skeleton, health check endpoint
- **Day 3**: User model with password hashing (bcrypt), JWT-based register & login endpoints
