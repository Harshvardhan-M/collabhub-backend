const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollabHub API',
      version: '1.0.0',
      description:
        'Real-time collaboration platform backend — workspaces, channels, chat, DMs, and notifications.',
    },
    servers: [{ url: '/api', description: 'Base API path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            avatar: { type: 'string' },
            status: { type: 'string', enum: ['online', 'offline', 'away'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            owner: { type: 'string' },
            inviteCode: { type: 'string' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'member'] },
                },
              },
            },
          },
        },
        Channel: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            workspace: { type: 'string' },
            isPrivate: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipient: { type: 'string' },
            sender: { type: 'string' },
            type: { type: 'string', enum: ['workspace_join', 'mention', 'message'] },
            message: { type: 'string' },
            read: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
