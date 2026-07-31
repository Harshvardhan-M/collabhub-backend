const Workspace = require('../models/Workspace');

const resolveMentions = async (content, workspaceId, senderId) => {
  const mentionRegex = /@(\w+)/g;
  const matches = [...content.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());

  if (matches.length === 0) return [];

  const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name');
  if (!workspace) return [];

  const mentionedUsers = workspace.members
    .map((m) => m.user)
    .filter((user) => {
      if (!user || user._id.toString() === senderId.toString()) return false;
      const firstName = user.name.split(' ')[0].toLowerCase();
      return matches.includes(firstName);
    });

  const unique = Array.from(new Map(mentionedUsers.map((u) => [u._id.toString(), u])).values());
  return unique;
};

module.exports = { resolveMentions };
