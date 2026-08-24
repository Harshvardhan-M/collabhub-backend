const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const requestId = require('./middlewares/requestId.middleware');
const requestLogger = require('./config/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const dmRoutes = require('./routes/dm.routes');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.use(requestId);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiLimiter);
}

app.use(
  '/api-docs',
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'CollabHub API Docs' })
);

// Serve uploaded files statically (e.g. /uploads/172839...-abc123.png)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CollabHub API is running' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
