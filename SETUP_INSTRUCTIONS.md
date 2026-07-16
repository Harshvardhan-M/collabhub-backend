# Day 2: User Authentication (JWT) — Setup Instructions

## 1. Copy these folders/files into your repo root
```
models/User.js
middleware/auth.js
routes/auth.js
```
Your repo structure should now look like:
```
collabhub-backend/
├── models/
│   └── User.js
├── middleware/
│   └── auth.js
├── routes/
│   └── auth.js
├── server.js
├── package.json
├── .env
└── .env.example
```

## 2. Install new dependencies
```bash
npm install bcryptjs jsonwebtoken
```

## 3. Add to your `.env` and `.env.example`
```
JWT_SECRET=your_super_secret_key_here
```

## 4. Edit `server.js`
Add near the top with your other requires:
```javascript
const authRoutes = require("./routes/auth");
```

Make sure JSON body parsing is enabled (add this once, before your routes, if it isn't already there):
```javascript
app.use(express.json());
```

Mount the auth routes alongside your existing routes:
```javascript
app.use("/api/auth", authRoutes);
```

## 5. Test it
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Get current user (use token from register/login response)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. Update your README Progress Log
```markdown
- **Day 2**: User authentication (JWT) — register, login, protected `/me` route with bcrypt password hashing
```
