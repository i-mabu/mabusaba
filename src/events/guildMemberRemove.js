const {
  Events,
} = require('discord.js');

const {
  sendAuditLog,
} = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member) {
    await sendAuditLog(
      member.guild,
      {
        title: '📤 メンバー退出',
        color: 0xff6600,
        fields: [
          {
            name: 'ユーザー',
            value:
              `${member.user.tag}`,
          },
          {
            name: 'ID',
            value: member.id,
          },
        ],
      }
    );
  },
};