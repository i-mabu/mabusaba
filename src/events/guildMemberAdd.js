const {
  Events,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const {
      WELCOME_CHANNEL_ID,
      LOG_CHANNEL_ID,
      AUTO_ROLE_ID,
    } = process.env;

    // ==============================
    // 自動ロール
    // ==============================

    if (AUTO_ROLE_ID) {
      try {
        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);

        if (!role) {
          console.warn(
            `⚠️ 自動ロールが見つかりません: ${AUTO_ROLE_ID}`
          );
        } else if (role.position >= member.guild.members.me.roles.highest.position) {
          console.warn(
            `⚠️ 自動ロール「${role.name}」はBotの最高位ロールより上にあります。`
          );
        } else {
          await member.roles.add(role);
          console.log(
            `✅ ${member.user.tag} に「${role.name}」を付与しました。`
          );
        }
      } catch (error) {
        console.error('❌ 自動ロール付与エラー:', error);
      }
    }

    // ==============================
    // ウェルカムメッセージ
    // ==============================

    if (WELCOME_CHANNEL_ID) {
      try {
        const channel = member.guild.channels.cache.get(
          WELCOME_CHANNEL_ID
        );

        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle('🎉 新しいメンバーが参加しました！')
            .setDescription(
              `**${member.user}** さん、まぶ鯖へようこそ！\n\n` +
              `ゆっくり楽しんでいってください！`
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
            .setColor(0x57f287)
            .setTimestamp();

          await channel.send({
            content: `${member.user} さんが参加しました！🎉`,
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error(
          '❌ ウェルカムメッセージ送信エラー:',
          error
        );
      }
    }

    // ==============================
    // 入室ログ
    // ==============================

    if (LOG_CHANNEL_ID) {
      try {
        const logChannel = member.guild.channels.cache.get(
          LOG_CHANNEL_ID
        );

        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📥 メンバー参加')
            .setDescription(
              `${member.user} がサーバーに参加しました。`
            )
            .addFields(
              {
                name: 'ユーザー',
                value: `${member.user.tag}`,
                inline: true,
              },
              {
                name: 'ユーザーID',
                value: member.user.id,
                inline: true,
              },
              {
                name: 'アカウント作成日',
                value: `<t:${Math.floor(
                  member.user.createdTimestamp / 1000
                )}:F>`,
                inline: false,
              }
            )
            .setThumbnail(
              member.user.displayAvatarURL({
                size: 256,
              })
            )
            .setColor(0x57f287)
            .setTimestamp();

          await logChannel.send({
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error(
          '❌ 入室ログ送信エラー:',
          error
        );
      }
    }
  },
};