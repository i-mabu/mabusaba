const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ユーザーをサーバーからBANします')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('BANするユーザー')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('BAN理由')
        .setMaxLength(500)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(
      PermissionFlagsBits.BanMembers
    )) {
      return interaction.reply({
        content: '❌ BAN権限がありません。',
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

    if (member && !member.bannable) {
      return interaction.reply({
        content:
          '❌ このユーザーをBANできません。\n' +
          'Botのロール位置を確認してください。',
        ephemeral: true,
      });
    }

    try {
      await interaction.guild.members.ban(user.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: 0,
      });

      await interaction.reply(
        `🔨 **${user.tag}** をBANしました。\n理由: ${reason}`
      );

      await sendModLog(interaction, {
        title: '🔨 ユーザーをBAN',
        color: 0xed4245,
        user,
        reason,
      });
    } catch (error) {
      console.error('ban error:', error);

      await interaction.reply({
        content: '❌ BANに失敗しました。',
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