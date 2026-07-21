const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    channel: {
      type: String,
      default: 'general',
    },
  },
  { timestamps: true }
);

messageSchema.index({ workspace: 1, channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
