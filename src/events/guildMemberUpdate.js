const {
  Events,
} = require('discord.js');

const {
  sendAuditLog,
} = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberUpdate,

  async execute(
    oldMember,
    newMember
  ) {
    const oldRoles =
      new Set(oldMember.roles.cache.keys());

    const newRoles =
      new Set(newMember.roles.cache.keys());

    const added = [
      ...newRoles,
    ].filter(id =>
      !oldRoles.has(id)
    );

    const removed = [
      ...oldRoles,
    ].filter(id =>
      !newRoles.has(id)
    );

    if (
      added.length === 0 &&
      removed.length === 0
    ) {
      return;
    }

    const changes = [];

    for (const id of added) {
      const role =
        newMember.guild.roles.cache.get(id);

      if (role) {
        changes.push(
          `➕ ${role.name}`
        );
      }
    }

    for (const id of removed) {
      const role =
        newMember.guild.roles.cache.get(id);

      if (role) {
        changes.push(
          `➖ ${role.name}`
        );
      }
    }

    await sendAuditLog(
      newMember.guild,
      {
        title: '🎭 ロール変更',
        color: 0x9b59b6,
        fields: [
          {
            name: 'ユーザー',
            value:
              `${newMember.user.tag}`,
          },
          {
            name: '変更',
            value:
              changes.join('\n') ||
              '変更なし',
          },
        ],
      }
    );
  },
};