const {
  EmbedBuilder
} = require('discord.js');

const {
  getWelcomeMessage,
  getStoredEmbed
} = require('../utils/welcomeMessage');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member) {
    try {
      const welcome =
        getWelcomeMessage(
          member.guild.id
        );

      /*
       * Welcome設定がない場合
       */
      if (!welcome) {
        return;
      }

      /*
       * チャンネル取得
       */
      const channel =
        await member.guild.channels.fetch(
          welcome.channel_id
        );

      if (!channel) {
        console.warn(
          `⚠️ Welcomeチャンネルが見つかりません: ${welcome.channel_id}`
        );

        return;
      }

      if (
        !channel.isTextBased()
      ) {
        console.warn(
          '⚠️ Welcomeチャンネルがテキストチャンネルではありません。'
        );

        return;
      }

      /*
       * Embed取得
       */
      const storedEmbed =
        getStoredEmbed(
          welcome
        );

      const embeds = [];

      if (storedEmbed) {
        const embed =
          new EmbedBuilder();

        /*
         * タイトル
         */
        if (
          storedEmbed.title
        ) {
          embed.setTitle(
            String(
              storedEmbed.title
            ).slice(
              0,
              256
            )
          );
        }

        /*
         * 本文
         */
        if (
          storedEmbed.description
        ) {
          /*
           * Discord Embed description最大4000
           */
          embed.setDescription(
            String(
              storedEmbed.description
            ).slice(
              0,
              4000
            )
          );
        }

        /*
         * 色
         */
        if (
          storedEmbed.color !==
            undefined &&
          storedEmbed.color !==
            null
        ) {
          embed.setColor(
            Number(
              storedEmbed.color
            )
          );
        }

        /*
         * ユーザー情報
         */
        embed.setThumbnail(
          member.user.displayAvatarURL({
            size: 256
          })
        );

        embeds.push(
          embed
        );
      }

      /*
       * ==================================================
       * Welcome送信
       * ==================================================
       */

      const content =
        welcome.content
          ? String(
              welcome.content
            ).replaceAll(
              '{user}',
              `<@${member.id}>`
            )
            : '';

      /*
       * {username}
       * {server}
       * {user}
       * を使えるようにする
       */

      const finalContent =
        content
          .replaceAll(
            '{username}',
            member.user.username
          )
          .replaceAll(
            '{server}',
            member.guild.name
          );

      await channel.send({
        content:
          finalContent || undefined,

        embeds
      });

      console.log(
        `👋 Welcome送信: ${member.user.tag} -> #${channel.name}`
      );

    } catch (error) {
      console.error(
        '❌ guildMemberAdd Welcome error:',
        error
      );
    }
  }
};