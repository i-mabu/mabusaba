const {
  EmbedBuilder
} = require('discord.js');

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
  fields = []
}) {
  try {
    /*
     * 環境変数から監査ログチャンネルを取得
     *
     * 例:
     * AUDIT_LOG_CHANNEL_ID=123456789012345678
     */

    const channelId =
      process.env.AUDIT_LOG_CHANNEL_ID;

    if (!channelId) {
      console.warn(
        '⚠️ AUDIT_LOG_CHANNEL_ID が設定されていません。'
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
        '⚠️ 監査ログチャンネルがテキストチャンネルではありません。'
      );

      return false;
    }

    const embed =
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(
          description || null
        )
        .setColor(color)
        .setTimestamp();

    if (
      fields &&
      fields.length > 0
    ) {
      embed.addFields(
        fields.slice(0, 25)
      );
    }

    await channel.send({
      embeds: [
        embed
      ]
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

module.exports = {
  sendAuditLog
};