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
    .setName('mute')
    .setDescription('メンバーをタイムアウトします')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('対象ユーザー')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('minutes')
        .setDescription('時間（分）')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('理由')
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

    const minutes =
      interaction.options.getInteger('minutes');

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

    if (!member.moderatable) {
      return interaction.reply({
        content:
          '❌ このメンバーをMuteできません。',
        ephemeral: true,
      });
    }

    await member.timeout(
      minutes * 60 * 1000,
      `${reason} / 実行者: ${interaction.user.tag}`
    );

    await interaction.reply({
      content:
        `🔇 ${user.tag} を${minutes}分Muteしました。`,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '🔇 Mute',
        color: 0xffcc00,
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
            name: '時間',
            value: `${minutes}分`,
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