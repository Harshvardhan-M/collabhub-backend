const Workspace = require('../models/Workspace');

/**
 * Extracts @mentions from a message (e.g. "hey @sam @priya check this")
 * and resolves them against the workspace's members, matching by name
 * (case-insensitive, first word of their name). Returns an array of
 * matched User documents, excluding the sender themselves.
 */
const resolveMentions = async (content, workspaceId, senderId) => {
  const mentionRegex = /@(\w+)/g;
  const matches = [...content.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());

  if (matches.length === 0) return [];

  const workspace = await Workspace.findById(workspaceId).populate(
    'members.user',
    'name'
  );
  if (!workspace) return [];

  const mentionedUsers = workspace.members
    .map((m) => m.user)
    .filter((user) => {
      if (!user || user._id.toString() === senderId.toString()) return false;
      const firstName = user.name.split(' ')[0].toLowerCase();
      return matches.includes(firstName);
    });

  // De-duplicate in case someone is mentioned twice
  const unique = Array.from(new Map(mentionedUsers.map((u) => [u._id.toString(), u])).values());
  return unique;
};

module.exports = { resolveMentions };
