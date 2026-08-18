const {
  EmbedBuilder
} = require('discord.js');

const {
  getFixedMessage,
  updateFixedMessage,
  getStoredEmbed
} = require('../utils/fixedMessage');

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message) {
    /*
     * Bot自身のメッセージは無視
     */
    if (message.author.bot) {
      return;
    }

    /*
     * DMは無視
     */
    if (!message.guild) {
      return;
    }

    const guildId =
      message.guild.id;

    /*
     * このサーバーの固定メッセージを取得
     */
    const fixed =
      getFixedMessage(guildId);

    if (!fixed) {
      return;
    }

    /*
     * 固定メッセージと別チャンネルなら無視
     */
    if (
      message.channel.id !==
      fixed.channel_id
    ) {
      return;
    }

    /*
     * ================================================
     * 固定メッセージより下に新規投稿された場合だけ処理
     * ================================================
     */

    /*
     * DiscordのメッセージIDはSnowflakeなので、
     * 基本的に後から作られたメッセージほどIDが大きい。
     */

    if (
      message.id <=
      fixed.message_id
    ) {
      return;
    }

    console.log(
      `📌 固定メッセージより下に新規メッセージを検知: ${message.id}`
    );

    /*
     * チャンネル取得
     */
    const channel =
      message.channel;

    /*
     * ================================================
     * 古い固定メッセージを取得
     * ================================================
     */

    let oldMessage = null;

    try {
      oldMessage =
        await channel.messages.fetch(
          fixed.message_id
        );
    } catch (error) {
      console.log(
        '⚠️ 既存の固定メッセージを取得できませんでした。'
      );
    }

    /*
     * ================================================
     * Embedデータを復元
     * ================================================
     */

    const storedEmbed =
      getStoredEmbed(fixed);

    let embeds = [];

    if (storedEmbed) {
      const embed =
        new EmbedBuilder();

      if (
        storedEmbed.title
      ) {
        embed.setTitle(
          storedEmbed.title
        );
      }

      if (
        storedEmbed.description
      ) {
        embed.setDescription(
          storedEmbed.description
        );
      }

      if (
        storedEmbed.color !==
        undefined &&
        storedEmbed.color !== null
      ) {
        embed.setColor(
          Number(
            storedEmbed.color
          )
        );
      }

      embeds = [embed];
    }

    /*
     * ================================================
     * 古い固定メッセージを削除
     * ================================================
     */

    if (oldMessage) {
      try {
        await oldMessage.delete();

        console.log(
          `🗑️ 固定メッセージ削除: ${fixed.message_id}`
        );

      } catch (error) {
        console.error(
          '❌ 固定メッセージ削除失敗:',
          error
        );

        return;
      }
    }

    /*
     * ================================================
     * 新しい固定メッセージを一番下へ送信
     * ================================================
     */

    try {
      const newMessage =
        await channel.send({
          content:
            fixed.content || '',
          embeds
        });

      console.log(
        `📌 固定メッセージを再配置: ${newMessage.id}`
      );

      /*
       * ==============================================
       * SQLite更新
       * ==============================================
       */

      updateFixedMessage({
        guildId,

        channelId:
          channel.id,

        messageId:
          newMessage.id,

        content:
          fixed.content || '',

        embed:
          storedEmbed,

        userId:
          fixed.updated_by
      });

      console.log(
        '✅ 固定メッセージの位置を更新しました。'
      );

    } catch (error) {
      console.error(
        '❌ 固定メッセージ再送信エラー:',
        error
      );
    }
  }
};