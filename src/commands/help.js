const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Botのコマンド一覧を表示します'),

  async execute(interaction) {
    const embed =
      new EmbedBuilder()
        .setTitle(
          '📚 まぶ鯖Bot コマンド一覧'
        )
        .addFields(
          {
            name: '🌐 一般',
            value:
              '`/ping`\n' +
              '`/help`\n' +
              '`/server`\n' +
              '`/userinfo`\n' +
              '`/test`',
          },
          {
            name: '🎮 ミニゲーム',
            value:
              '`/game` — ゲームメニュー\n' +
              '`/profile` — ゲームプロフィール\n' +
              '`/ranking` — ランキング',
          },
          {
            name: '🛡️ モデレーション',
            value:
              '`/warn`\n' +
              '`/mute`\n' +
              '`/unmute`\n' +
              '`/kick`\n' +
              '`/ban`\n' +
              '`/clear`',
          }
        )
        .setColor(0x5865f2);

    await interaction.reply({
      embeds: [embed],
    });
  },
};