const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('ユーザーのタイムアウトを解除します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('タイムアウトを解除するユーザー')
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
          '❌ このユーザーのタイムアウトを解除できません。',
        ephemeral: true,
      });
    }

    try {
      await member.timeout(
        null,
        `${interaction.user.tag}: ${reason}`
      );

      await interaction.reply(
        `🔊 **${user.tag}** のタイムアウトを解除しました。\n` +
        `理由: ${reason}`
      );

      await sendModLog(interaction, {
        title: '🔊 タイムアウト解除',
        color: 0x57f287,
        user,
        reason,
      });
    } catch (error) {
      console.error('unmute error:', error);

      await interaction.reply({
        content: '❌ タイムアウト解除に失敗しました。',
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