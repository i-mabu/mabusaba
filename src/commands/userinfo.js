const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('ユーザーの情報を表示します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('情報を表示するユーザー')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user =
      interaction.options.getUser('user') ||
      interaction.user;

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.username} の情報`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: 'ユーザー名',
          value: user.username,
          inline: true,
        },
        {
          name: 'ID',
          value: user.id,
          inline: true,
        },
        {
          name: 'Bot',
          value: user.bot ? 'はい 🤖' : 'いいえ',
          inline: true,
        },
        {
          name: 'アカウント作成日',
          value: `<t:${Math.floor(
            user.createdTimestamp / 1000
          )}:F>`,
          inline: false,
        }
      )
      .setColor(0x5865f2)
      .setTimestamp();

    if (member) {
      embed.addFields({
        name: 'サーバー参加日',
        value: `<t:${Math.floor(
          member.joinedTimestamp / 1000
        )}:F>`,
        inline: false,
      });
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};