const {
  SlashCommandBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botの応答速度を確認します'),

  async execute(interaction) {
    await interaction.reply(
      `🏓 Pong! ${interaction.client.ws.ping}ms`
    );
  },
};