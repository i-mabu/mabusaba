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
    .setName('kick')
    .setDescription('メンバーをKickします')
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
      PermissionFlagsBits.KickMembers
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

    if (!member) {
      return interaction.reply({
        content:
          '❌ 対象メンバーが見つかりません。',
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content:
          '❌ このメンバーをKickできません。',
        ephemeral: true,
      });
    }

    await member.kick(
      `${reason} / 実行者: ${interaction.user.tag}`
    );

    await interaction.reply({
      content:
        `👢 ${user.tag} をKickしました。`,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '👢 Kick',
        color: 0xff8c00,
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