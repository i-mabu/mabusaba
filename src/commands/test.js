const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const {
  isAdmin,
  isModerator,
  canManageGuild,
} = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Botの機能を権限別に診断します'),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    const member = interaction.member;

    const admin = isAdmin(member);
    const moderator = isModerator(member);
    const manager = canManageGuild(member);

    const results = [];

    /*
     * 基本
     */

    results.push({
      name: '🤖 Bot',
      value: '✅ 正常',
      inline: true,
    });

    results.push({
      name: '📡 Ping',
      value: `${interaction.client.ws.ping}ms`,
      inline: true,
    });

    /*
     * 権限レベル
     */

    let level = '一般ユーザー';

    if (admin) {
      level = '👑 Administrator';
    } else if (manager) {
      level = '🛠️ Server Manager';
    } else if (moderator) {
      level = '🛡️ Moderator';
    }

    results.push({
      name: '🔐 実行者権限',
      value: level,
    });

    /*
     * モデレーター以上
     */

    if (moderator) {
      const checks = [
        [
          PermissionFlagsBits.KickMembers,
          'Kick',
        ],
        [
          PermissionFlagsBits.BanMembers,
          'Ban',
        ],
        [
          PermissionFlagsBits.ModerateMembers,
          'Mute',
        ],
      ];

      for (const [permission, name] of checks) {
        results.push({
          name: `🔧 ${name}`,
          value:
            member.permissions.has(permission)
              ? '✅ 使用可能'
              : '❌ 使用不可',
          inline: true,
        });
      }
    }

    /*
     * サーバー管理者以上
     */

    if (manager || admin) {
      const commandFiles = fs
        .readdirSync(__dirname)
        .filter(file =>
          file.endsWith('.js')
        );

      results.push({
        name: '📦 Commands',
        value: `✅ ${commandFiles.length}個`,
      });

      const eventsPath = path.join(
        __dirname,
        '../events'
      );

      if (fs.existsSync(eventsPath)) {
        const eventFiles = fs
          .readdirSync(eventsPath)
          .filter(file =>
            file.endsWith('.js')
          );

        results.push({
          name: '⚡ Events',
          value: `✅ ${eventFiles.length}個`,
        });
      }

      const envs = [
        ['WELCOME_CHANNEL_ID', '👋 Welcome'],
        ['LOG_CHANNEL_ID', '📝 Log'],
        ['MOD_LOG_CHANNEL_ID', '🛡️ Mod Log'],
        ['AUTO_ROLE_ID', '🎭 Auto Role'],
      ];

      for (const [env, label] of envs) {
        results.push({
          name: label,
          value: process.env[env]
            ? '✅ 設定済み'
            : '❌ 未設定',
          inline: true,
        });
      }
    }

    /*
     * Embed
     */

    const embed = new EmbedBuilder()
      .setTitle('🧪 まぶ鯖Bot 機能診断')
      .setDescription(
        '実行者の権限に応じた診断結果です。'
      )
      .addFields(results)
      .setTimestamp()
      .setColor(
        admin
          ? 0xff0000
          : moderator
            ? 0xffa500
            : 0x5865f2
      )
      .setFooter({
        text:
          `実行者: ${interaction.user.tag}`,
      });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};