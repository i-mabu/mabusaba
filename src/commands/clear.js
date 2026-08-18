const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('指定した数のメッセージを削除します')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('削除するメッセージ数')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (!interaction.member.permissions.has(
      PermissionFlagsBits.ManageMessages
    )) {
      return interaction.reply({
        content: '❌ このコマンドを使用する権限がありません。',
        ephemeral: true,
      });
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const deleted = await interaction.channel.bulkDelete(
        amount,
        true
      );

      await interaction.editReply(
        `🧹 **${deleted.size}件**のメッセージを削除しました。`
      );

      // 監査ログ
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;

      if (logChannelId) {
        const logChannel =
          interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          await logChannel.send({
            embeds: [{
              title: '🧹 メッセージ削除',
              fields: [
                {
                  name: '実行者',
                  value: `${interaction.user} (${interaction.user.id})`,
                },
                {
                  name: 'チャンネル',
                  value: `${interaction.channel}`,
                },
                {
                  name: '削除数',
                  value: `${deleted.size}件`,
                },
              ],
              color: 0xfee75c,
              timestamp: new Date().toISOString(),
            }],
          });
        }
      }
    } catch (error) {
      console.error('clear error:', error);

      await interaction.editReply(
        '❌ メッセージの削除に失敗しました。'
      );
    }
  },
};