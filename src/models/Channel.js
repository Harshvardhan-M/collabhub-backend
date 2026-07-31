const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Channel name is required'], trim: true, lowercase: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrivate: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

channelSchema.index({ workspace: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Channel', channelSchema);
