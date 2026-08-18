const {
  Events,
  ActivityType,
} = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log('=================================');
    console.log('🤖 まぶ鯖Bot 起動完了！');
    console.log('=================================');
    console.log(`👤 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🏠 接続サーバー数: ${client.guilds.cache.size}`);
    console.log(`📦 コマンド数: ${client.commands.size}`);
    console.log('=================================');

    // Botのステータス
    client.user.setPresence({
      activities: [
        {
          name: 'まぶ鯖',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });
  },
};