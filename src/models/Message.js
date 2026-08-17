const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Not required at the schema level — a message can be attachment-only (e.g. just an image).
    // The socket handler enforces that at least one of content/attachment is present.
    content: { type: String, trim: true, default: '' },
    channel: { type: String, default: 'general' },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    attachment: {
      url: { type: String },
      filename: { type: String },
      mimetype: { type: String },
      size: { type: Number },
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ workspace: 1, channel: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

module.exports = mongoose.model('Message', messageSchema);
