const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('ユーザーに警告を出します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('警告するユーザー')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('警告理由')
        .setMaxLength(500)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(
      PermissionFlagsBits.ModerateMembers
    )) {
      return interaction.reply({
        content: '❌ 警告権限がありません。',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');

    const reason =
      interaction.options.getString('reason');

    await interaction.reply(
      `⚠️ **${user.tag}** に警告を出しました。\n` +
      `理由: ${reason}`
    );

    const channelId = process.env.MOD_LOG_CHANNEL_ID;

    if (!channelId) return;

    const channel =
      interaction.guild.channels.cache.get(channelId);

    if (!channel) return;

    await channel.send({
      embeds: [{
        title: '⚠️ 警告',
        color: 0xfee75c,
        fields: [
          {
            name: '対象ユーザー',
            value: `${user.tag}\n${user.id}`,
          },
          {
            name: '実行者',
            value:
              `${interaction.user.tag}\n${interaction.user.id}`,
          },
          {
            name: '理由',
            value: reason,
          },
        ],
        timestamp: new Date().toISOString(),
      }],
    }).catch(console.error);
  },
};