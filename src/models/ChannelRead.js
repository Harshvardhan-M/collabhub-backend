const mongoose = require('mongoose');

const channelReadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    channel: { type: String, required: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

channelReadSchema.index({ user: 1, workspace: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('ChannelRead', channelReadSchema);
