const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('サーバー情報を表示します'),

  async execute(interaction) {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .addFields(
        {
          name: '👥 メンバー',
          value: `${guild.memberCount}人`,
          inline: true,
        },
        {
          name: '🆔 Server ID',
          value: guild.id,
          inline: true,
        },
        {
          name: '📅 作成日',
          value: `<t:${Math.floor(
            guild.createdTimestamp / 1000
          )}:F>`,
        }
      )
      .setColor(0x5865f2);

    await interaction.reply({
      embeds: [embed],
    });
  },
};