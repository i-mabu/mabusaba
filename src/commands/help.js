const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('まぶ鯖Botのコマンド一覧を表示します'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 まぶ鯖Bot ヘルプ')
      .setDescription('現在使用できるコマンド一覧です。')
      .addFields(
        {
          name: '🏓 基本',
          value:
            '`/ping` — Botの応答速度を確認\n' +
            '`/help` — このヘルプを表示',
        },
        {
          name: '👤 ユーザー',
          value:
            '`/userinfo` — ユーザー情報を表示',
        },
        {
          name: '🏠 サーバー',
          value:
            '`/server` — まぶ鯖のサーバー情報を表示',
        }
      )
      .setColor(0x5865f2)
      .setFooter({
        text: 'まぶ鯖 Bot',
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};