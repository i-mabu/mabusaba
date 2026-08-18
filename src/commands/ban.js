const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const {
  isModerator,
} = require('../utils/permissions');

const {
  sendAuditLog,
} = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('メンバーをBANします')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('対象ユーザー')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('理由')
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers
    ),

  async execute(interaction) {
    if (!isModerator(interaction.member)) {
      return interaction.reply({
        content:
          '❌ モデレーター権限が必要です。',
        ephemeral: true,
      });
    }

    const user =
      interaction.options.getUser('user');

    const reason =
      interaction.options.getString('reason') ||
      '理由なし';

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({
        content:
          '❌ このメンバーをBANできません。',
        ephemeral: true,
      });
    }

    await interaction.guild.members.ban(
      user.id,
      {
        reason:
          `${reason} / 実行者: ${interaction.user.tag}`,
      }
    );

    await interaction.reply({
      content:
        `🔨 ${user.tag} をBANしました。`,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '🔨 BAN',
        color: 0xff0000,
        fields: [
          {
            name: '対象',
            value: `${user.tag}`,
          },
          {
            name: '実行者',
            value: `${interaction.user.tag}`,
          },
          {
            name: '理由',
            value: reason,
          },
        ],
      }
    );
  },
};