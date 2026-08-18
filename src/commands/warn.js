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
    .setName('warn')
    .setDescription('メンバーに警告します')
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
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
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
      interaction.options.getString('reason');

    await interaction.reply({
      content:
        `⚠️ ${user.tag} に警告しました。`,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '⚠️ Warn',
        color: 0xffff00,
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