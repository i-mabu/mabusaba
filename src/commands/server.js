const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('まぶ鯖のサーバー情報を表示します'),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます。',
        ephemeral: true,
      });
    }

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(
        guild.iconURL({
          size: 256,
        })
      )
      .addFields(
        {
          name: '👥 メンバー数',
          value: `${guild.memberCount}人`,
          inline: true,
        },
        {
          name: '💬 チャンネル数',
          value: `${guild.channels.cache.size}個`,
          inline: true,
        },
        {
          name: '😀 絵文字数',
          value: `${guild.emojis.cache.size}個`,
          inline: true,
        },
        {
          name: '👑 サーバー所有者',
          value: owner
            ? `${owner.user.tag}`
            : '取得できませんでした',
          inline: false,
        },
        {
          name: '📅 作成日',
          value: `<t:${Math.floor(
            guild.createdTimestamp / 1000
          )}:F>`,
          inline: false,
        },
        {
          name: '🆔 サーバーID',
          value: guild.id,
          inline: false,
        }
      )
      .setColor(0x5865f2)
      .setFooter({
        text: 'まぶ鯖 Bot',
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};