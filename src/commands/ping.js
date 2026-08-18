const {
  SlashCommandBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botの応答速度を確認します'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 計測中...',
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const websocketPing = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 Pong!\n` +
      `📡 応答速度: **${latency}ms**\n` +
      `💓 WebSocket: **${websocketPing}ms**`
    );
  },
};