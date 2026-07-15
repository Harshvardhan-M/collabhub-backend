require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Only connect to DB if MONGO_URI is set (so server can boot even without it on Day 1)
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('MONGO_URI not set — skipping DB connection for now.');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
