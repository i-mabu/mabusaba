const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('ユーザーをサーバーからキックします')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('キックするユーザー')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('キック理由')
        .setMaxLength(500)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(
      PermissionFlagsBits.KickMembers
    )) {
      return interaction.reply({
        content: '❌ キック権限がありません。',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');
    const reason =
      interaction.options.getString('reason') ||
      '理由なし';

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ そのユーザーはサーバーにいません。',
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content:
          '❌ このユーザーをキックできません。\n' +
          'Botのロールが対象ユーザーより上にあるか確認してください。',
        ephemeral: true,
      });
    }

    try {
      await member.kick(
        `${interaction.user.tag}: ${reason}`
      );

      await interaction.reply(
        `👢 **${user.tag}** をキックしました。\n理由: ${reason}`
      );

      await sendModLog(interaction, {
        title: '👢 ユーザーをキック',
        color: 0xfee75c,
        user,
        reason,
      });
    } catch (error) {
      console.error('kick error:', error);

      await interaction.reply({
        content: '❌ キックに失敗しました。',
        ephemeral: true,
      });
    }
  },
};

async function sendModLog(interaction, data) {
  const channelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!channelId) return;

  const channel =
    interaction.guild.channels.cache.get(channelId);

  if (!channel) return;

  await channel.send({
    embeds: [{
      title: data.title,
      color: data.color,
      fields: [
        {
          name: '対象ユーザー',
          value: `${data.user.tag}\n${data.user.id}`,
        },
        {
          name: '実行者',
          value: `${interaction.user.tag}\n${interaction.user.id}`,
        },
        {
          name: '理由',
          value: data.reason,
        },
      ],
      timestamp: new Date().toISOString(),
    }],
  }).catch(console.error);
}