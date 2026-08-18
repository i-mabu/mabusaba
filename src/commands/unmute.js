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
    .setName('unmute')
    .setDescription('タイムアウトを解除します')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('対象ユーザー')
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
          '❌ このメンバーを操作できません。',
        ephemeral: true,
      });
    }

    await member.timeout(
      null,
      `Mute解除 / 実行者: ${interaction.user.tag}`
    );

    await interaction.reply({
      content:
        `🔊 ${user.tag} のMuteを解除しました。`,
    });

    await sendAuditLog(
      interaction.guild,
      {
        title: '🔊 Mute解除',
        color: 0x00ff00,
        fields: [
          {
            name: '対象',
            value: `${user.tag}`,
          },
          {
            name: '実行者',
            value: `${interaction.user.tag}`,
          },
        ],
      }
    );
  },
};