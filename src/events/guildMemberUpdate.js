const {
  Events,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    const {
      LOG_CHANNEL_ID,
    } = process.env;

    if (!LOG_CHANNEL_ID) return;

    const logChannel = newMember.guild.channels.cache.get(
      LOG_CHANNEL_ID
    );

    if (!logChannel) return;

    // ==============================
    // ロール追加
    // ==============================

    const addedRoles = newMember.roles.cache.filter(
      role => !oldMember.roles.cache.has(role.id)
    );

    for (const role of addedRoles.values()) {
      if (role.id === newMember.guild.id) continue;

      const embed = new EmbedBuilder()
        .setTitle('➕ ロール追加')
        .setDescription(
          `${newMember.user} にロールが追加されました。`
        )
        .addFields(
          {
            name: 'ユーザー',
            value: newMember.user.tag,
            inline: true,
          },
          {
            name: 'ロール',
            value: `${role}`,
            inline: true,
          }
        )
        .setColor(0x57f287)
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
      }).catch(console.error);
    }

    // ==============================
    // ロール削除
    // ==============================

    const removedRoles = oldMember.roles.cache.filter(
      role => !newMember.roles.cache.has(role.id)
    );

    for (const role of removedRoles.values()) {
      if (role.id === newMember.guild.id) continue;

      const embed = new EmbedBuilder()
        .setTitle('➖ ロール削除')
        .setDescription(
          `${newMember.user} からロールが削除されました。`
        )
        .addFields(
          {
            name: 'ユーザー',
            value: newMember.user.tag,
            inline: true,
          },
          {
            name: 'ロール',
            value: `${role.name}`,
            inline: true,
          }
        )
        .setColor(0xed4245)
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
      }).catch(console.error);
    }
  },
};