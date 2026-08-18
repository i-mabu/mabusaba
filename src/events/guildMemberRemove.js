const {
  Events,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,

  async execute(member) {
    const {
      WELCOME_CHANNEL_ID,
      LOG_CHANNEL_ID,
    } = process.env;

    // ==============================
    // 退室通知
    // ==============================

    if (WELCOME_CHANNEL_ID) {
      try {
        const channel = member.guild.channels.cache.get(
          WELCOME_CHANNEL_ID
        );

        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle('👋 メンバーが退出しました')
            .setDescription(
              `**${member.user.tag}** さんがまぶ鯖から退出しました。`
            )
            .setThumbnail(
              member.user.displayAvatarURL({
                size: 256,
              })
            )
            .addFields({
              name: '👥 現在のメンバー数',
              value: `${member.guild.memberCount}人`,
              inline: true,
            })
            .setColor(0xed4245)
            .setTimestamp();

          await channel.send({
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error(
          '❌ 退室通知エラー:',
          error
        );
      }
    }

    // ==============================
    // 退室ログ
    // ==============================

    if (LOG_CHANNEL_ID) {
      try {
        const logChannel = member.guild.channels.cache.get(
          LOG_CHANNEL_ID
        );

        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📤 メンバー退出')
            .setDescription(
              `${member.user.tag} がサーバーから退出しました。`
            )
            .addFields(
              {
                name: 'ユーザーID',
                value: member.user.id,
                inline: true,
              },
              {
                name: '参加日時',
                value: member.joinedTimestamp
                  ? `<t:${Math.floor(
                      member.joinedTimestamp / 1000
                    )}:F>`
                  : '不明',
                inline: false,
              }
            )
            .setThumbnail(
              member.user.displayAvatarURL({
                size: 256,
              })
            )
            .setColor(0xed4245)
            .setTimestamp();

          await logChannel.send({
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error(
          '❌ 退室ログ送信エラー:',
          error
        );
      }
    }
  },
};