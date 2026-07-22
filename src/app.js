const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CollabHub API is running' });
});

module.exports = app;
