const {
  EmbedBuilder,
} = require('discord.js');

async function sendAuditLog(
  guild,
  {
    title,
    description,
    color = 0x5865f2,
    fields = [],
  }
) {
  const channelId =
    process.env.MOD_LOG_CHANNEL_ID ||
    process.env.LOG_CHANNEL_ID;

  if (!channelId) return;

  const channel =
    guild.channels.cache.get(channelId);

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description || null)
    .setColor(color)
    .addFields(fields)
    .setTimestamp();

  try {
    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    console.error(
      '監査ログ送信エラー:',
      error
    );
  }
}

module.exports = {
  sendAuditLog,
};