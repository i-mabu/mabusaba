const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('まぶ鯖Botの機能を診断します')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    const client = interaction.client;
    const guild = interaction.guild;

    const results = [];

    // ==============================
    // Bot
    // ==============================

    results.push({
      name: '🤖 Bot接続',
      value: '✅ 正常',
    });

    results.push({
      name: '📡 WebSocket Ping',
      value: `${client.ws.ping}ms`,
    });

    // ==============================
    // Commands
    // ==============================

    const commandsPath = path.join(
      __dirname
    );

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'));

    results.push({
      name: '📦 コマンド読み込み',
      value: `✅ ${commandFiles.length}個`,
    });

    // ==============================
    // Events
    // ==============================

    const eventsPath = path.join(
      __dirname,
      '../events'
    );

    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith('.js'));

      results.push({
        name: '⚡ Event',
        value: `✅ ${eventFiles.length}個`,
      });
    } else {
      results.push({
        name: '⚡ Event',
        value: '❌ eventsフォルダがありません',
      });
    }

    // ==============================
    // Environment
    // ==============================

    const envChecks = [
      ['WELCOME_CHANNEL_ID', '👋 Welcome'],
      ['LOG_CHANNEL_ID', '📝 Log'],
      ['AUTO_ROLE_ID', '🎭 Auto Role'],
      ['MOD_LOG_CHANNEL_ID', '🛡️ Mod Log'],
    ];

    for (const [envName, label] of envChecks) {
      results.push({
        name: label,
        value: process.env[envName]
          ? '✅ 設定済み'
          : '⚠️ 未設定',
      });
    }

    // ==============================
    // Channels
    // ==============================

    const channelChecks = [
      ['WELCOME_CHANNEL_ID', '👋 Welcome Channel'],
      ['LOG_CHANNEL_ID', '📝 Log Channel'],
      ['MOD_LOG_CHANNEL_ID', '🛡️ Mod Log Channel'],
    ];

    for (const [envName, label] of channelChecks) {
      const channelId = process.env[envName];

      if (!channelId) continue;

      const channel =
        guild.channels.cache.get(channelId);

      results.push({
        name: label,
        value: channel
          ? `✅ ${channel.name}`
          : '❌ チャンネルが見つかりません',
      });
    }

    // ==============================
    // Auto Role
    // ==============================

    if (process.env.AUTO_ROLE_ID) {
      const role = guild.roles.cache.get(
        process.env.AUTO_ROLE_ID
      );

      if (!role) {
        results.push({
          name: '🎭 Auto Role',
          value: '❌ ロールが見つかりません',
        });
      } else {
        const botMember = guild.members.me;

        const canManage =
          botMember &&
          role.position <
            botMember.roles.highest.position;

        results.push({
          name: '🎭 Auto Role',
          value: canManage
            ? `✅ ${role.name}`
            : `⚠️ ${role.name}（Botより上位）`,
        });
      }
    }

    // ==============================
    // Bot Permissions
    // ==============================

    const botMember = guild.members.me;

    if (botMember) {
      const permissions = [
        [
          PermissionFlagsBits.ViewChannel,
          'チャンネルを見る',
        ],
        [
          PermissionFlagsBits.SendMessages,
          'メッセージ送信',
        ],
        [
          PermissionFlagsBits.EmbedLinks,
          '埋め込みリンク',
        ],
        [
          PermissionFlagsBits.ManageMessages,
          'メッセージ管理',
        ],
        [
          PermissionFlagsBits.KickMembers,
          'キック',
        ],
        [
          PermissionFlagsBits.BanMembers,
          'BAN',
        ],
        [
          PermissionFlagsBits.ModerateMembers,
          'タイムアウト',
        ],
        [
          PermissionFlagsBits.ManageRoles,
          'ロール管理',
        ],
      ];

      const missing = permissions
        .filter(([permission]) =>
          !botMember.permissions.has(permission)
        )
        .map(([, name]) => name);

      results.push({
        name: '🔐 Bot権限',
        value: missing.length === 0
          ? '✅ 必要権限あり'
          : `⚠️ 不足: ${missing.join(', ')}`,
      });
    }

    // ==============================
    // Guild
    // ==============================

    results.push({
      name: '🏠 サーバー',
      value: guild.name,
    });

    results.push({
      name: '👥 メンバー',
      value: `${guild.memberCount}人`,
    });

    // ==============================
    // Result
    // ==============================

    const embed = new EmbedBuilder()
      .setTitle('🧪 まぶ鯖Bot 機能診断')
      .setDescription(
        'Botの現在の状態をチェックしました。'
      )
      .addFields(results)
      .setColor(0x5865f2)
      .setFooter({
        text: `実行者: ${interaction.user.tag}`,
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};