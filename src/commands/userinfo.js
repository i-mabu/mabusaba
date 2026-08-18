const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('ユーザー情報を表示します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('対象ユーザー')
    ),

  async execute(interaction) {
    const user =
      interaction.options.getUser('user') ||
      interaction.user;

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: '🆔 ID',
          value: user.id,
        },
        {
          name: '📅 アカウント作成',
          value: `<t:${Math.floor(
            user.createdTimestamp / 1000
          )}:F>`,
        }
      )
      .setColor(0x5865f2);

    if (member) {
      embed.addFields({
        name: '📅 サーバー参加',
        value: `<t:${Math.floor(
          member.joinedTimestamp / 1000
        )}:F>`,
      });
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};