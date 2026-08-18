const {
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

/*
 * =========================================================
 * 監査ログチャンネルID
 * =========================================================
 */

function getAuditLogChannelId() {
  return (
    process.env.AUDIT_LOG_CHANNEL_ID ||
    process.env.MOD_LOG_CHANNEL_ID ||
    process.env.LOG_CHANNEL_ID ||
    null
  );
}

/*
 * =========================================================
 * 監査ログ送信
 * =========================================================
 */

async function sendAuditLog({
  guild,
  title,
  description,
  color = 0x5865f2,
  fields = [],
}) {
  try {
    if (!guild) {
      console.warn(
        '⚠️ 監査ログ: guildがありません。'
      );

      return false;
    }

    const channelId =
      getAuditLogChannelId();

    if (!channelId) {
      console.warn(
        '⚠️ AUDIT_LOG_CHANNEL_ID / MOD_LOG_CHANNEL_ID / LOG_CHANNEL_ID が設定されていません。'
      );

      return false;
    }

    const channel =
      await guild.channels.fetch(
        channelId
      );

    if (!channel) {
      console.warn(
        `⚠️ 監査ログチャンネルが見つかりません: ${channelId}`
      );

      return false;
    }

    if (
      !channel.isTextBased()
    ) {
      console.warn(
        `⚠️ 監査ログチャンネルがテキストチャンネルではありません: ${channelId}`
      );

      return false;
    }

    const me =
      guild.members.me;

    if (me) {
      const permissions =
        channel.permissionsFor(me);

      if (
        !permissions?.has(
          PermissionFlagsBits.ViewChannel
        )
      ) {
        console.error(
          '❌ 監査ログチャンネルを見る権限がありません。'
        );

        return false;
      }

      if (
        !permissions?.has(
          PermissionFlagsBits.SendMessages
        )
      ) {
        console.error(
          '❌ 監査ログチャンネルへメッセージを送信する権限がありません。'
        );

        return false;
      }

      if (
        !permissions?.has(
          PermissionFlagsBits.EmbedLinks
        )
      ) {
        console.error(
          '❌ 監査ログチャンネルでEmbed Links権限がありません。'
        );

        return false;
      }
    }

    const embed =
      new EmbedBuilder()
        .setTitle(
          String(title || '監査ログ').slice(
            0,
            256
          )
        )
        .setColor(
          color
        )
        .setTimestamp();

    if (
      description
    ) {
      embed.setDescription(
        String(description).slice(
          0,
          4096
        )
      );
    }

    if (
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      const safeFields =
        fields
          .filter(
            field =>
              field &&
              field.name &&
              field.value
          )
          .slice(
            0,
            25
          )
          .map(
            field => ({
              name:
                String(
                  field.name
                ).slice(
                  0,
                  256
                ),

              value:
                String(
                  field.value
                ).slice(
                  0,
                  1024
                ),

              inline:
                Boolean(
                  field.inline
                ),
            })
          );

      if (
        safeFields.length > 0
      ) {
        embed.addFields(
          safeFields
        );
      }
    }

    await channel.send({
      embeds: [
        embed
      ],
      allowedMentions: {
        parse: [],
      },
    });

    return true;

  } catch (error) {
    console.error(
      '❌ 監査ログ送信エラー:',
      error
    );

    return false;
  }
}

/*
 * =========================================================
 * Audit Log取得
 * =========================================================
 */

async function fetchAuditEntry({
  guild,
  type,
  targetId,
  maxAge = 10000,
}) {
  try {
    if (!guild) {
      return null;
    }

    const logs =
      await guild.fetchAuditLogs({
        type,
        limit: 10,
      });

    const now =
      Date.now();

    const entry =
      logs.entries.find(
        log => {
          if (
            targetId &&
            log.target?.id !==
              targetId
          ) {
            return false;
          }

          if (
            now -
              log.createdTimestamp >
            maxAge
          ) {
            return false;
          }

          return true;
        }
      );

    return entry || null;

  } catch (error) {
    console.error(
      '❌ Discord監査ログ取得エラー:',
      error
    );

    return null;
  }
}

module.exports = {
  sendAuditLog,
  fetchAuditEntry,
  getAuditLogChannelId,
};