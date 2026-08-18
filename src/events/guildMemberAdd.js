const {
  Events,
  EmbedBuilder,
} = require('discord.js');

const {
  sendAuditLog,
} = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    /*
     * 自動ロール
     */

    const roleId =
      process.env.AUTO_ROLE_ID;

    if (roleId) {
      const role =
        member.guild.roles.cache.get(roleId);

      if (role && role.editable) {
        await member.roles.add(role)
          .catch(error =>
            console.error(
              '自動ロールエラー:',
              error
            )
          );
      }
    }

    /*
     * Welcome
     */

    const welcomeId =
      process.env.WELCOME_CHANNEL_ID;

    if (welcomeId) {
      const channel =
        member.guild.channels.cache.get(
          welcomeId
        );

      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('🎉 新しいメンバー')
          .setDescription(
            `ようこそ ${member} さん！`
          )
          .setThumbnail(
            member.user.displayAvatarURL()
          )
          .setColor(0x00ff88)
          .setTimestamp();

        await channel.send({
          embeds: [embed],
        }).catch(() => {});
      }
    }

    /*
     * 監査ログ
     */

    await sendAuditLog(
      member.guild,
      {
        title: '📥 メンバー参加',
        color: 0x00ff00,
        fields: [
          {
            name: 'ユーザー',
            value: `${member.user.tag}`,
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