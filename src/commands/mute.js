const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('ユーザーをタイムアウトします')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('タイムアウトするユーザー')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('minutes')
        .setDescription('タイムアウト時間（分）')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('理由')
        .setMaxLength(500)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(
      PermissionFlagsBits.ModerateMembers
    )) {
      return interaction.reply({
        content: '❌ タイムアウト権限がありません。',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');
    const minutes =
      interaction.options.getInteger('minutes');

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

    if (!member.moderatable) {
      return interaction.reply({
        content:
          '❌ このユーザーをタイムアウトできません。',
        ephemeral: true,
      });
    }

    try {
      await member.timeout(
        minutes * 60 * 1000,
        `${interaction.user.tag}: ${reason}`
      );

      await interaction.reply(
        `🔇 **${user.tag}** を **${minutes}分**タイムアウトしました。\n` +
        `理由: ${reason}`
      );

      await sendModLog(interaction, {
        title: '🔇 タイムアウト',
        color: 0xfee75c,
        user,
        reason: `${minutes}分\n${reason}`,
      });
    } catch (error) {
      console.error('mute error:', error);

      await interaction.reply({
        content: '❌ タイムアウトに失敗しました。',
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
          name: '内容',
          value: data.reason,
        },
      ],
      timestamp: new Date().toISOString(),
    }],
  }).catch(console.error);
}