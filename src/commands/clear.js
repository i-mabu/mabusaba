const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const {
  canManageMessages,
} = require('../utils/permissions');

const {
  sendAuditLog,
} = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('メッセージを削除します')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('削除する件数')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    ),

  async execute(interaction) {
    if (
      !canManageMessages(
        interaction.member
      )
    ) {
      return interaction.reply({
        content:
          '❌ メッセージ管理権限が必要です。',
        ephemeral: true,
      });
    }

    const amount =
      interaction.options.getInteger(
        'amount'
      );

    const deleted =
      await interaction.channel.bulkDelete(
        amount,
        true
      );

    await interaction.reply({
      content:
        `🧹 ${deleted.size}件削除しました。`,
        ephemeral: true,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '🧹 メッセージ削除',
        color: 0xffa500,
        fields: [
          {
            name: '実行者',
            value: `${interaction.user}`,
          },
          {
            name: 'チャンネル',
            value: `${interaction.channel}`,
          },
          {
            name: '件数',
            value: `${deleted.size}件`,
          },
        ],
      }
    );
  },
};