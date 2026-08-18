const {
  EmbedBuilder
} = require('discord.js');

const {
  getWelcomeMessage,
  getStoredEmbed
} = require('../utils/welcomeMessage');

const {
  sendAuditLog
} = require('../utils/auditLog');

/*
 * =========================================================
 * guildMemberAdd
 * =========================================================
 */

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member) {
    /*
     * Welcome / 自動ロール / 監査ログの
     * どれかが失敗しても他の処理を止めない。
     */

    await handleAutoRole(
      member
    );

    await handleWelcome(
      member
    );

    await handleAuditLog(
      member
    );
  }
};

/*
 * =========================================================
 * 自動ロール
 * =========================================================
 */

async function handleAutoRole(
  member
) {
  try {
    /*
     * 環境変数
     *
     * AUTO_ROLE_ID=123456789012345678
     */

    const roleId =
      process.env.AUTO_ROLE_ID;

    if (!roleId) {
      console.warn(
        '⚠️ AUTO_ROLE_ID が設定されていません。'
      );

      return;
    }

    const role =
      await member.guild.roles.fetch(
        roleId
      );

    if (!role) {
      console.error(
        `❌ 自動ロールが見つかりません: ${roleId}`
      );

      return;
    }

    /*
     * @everyone
     */

    if (
      role.id ===
      member.guild.id
    ) {
      console.error(
        '❌ @everyone を自動ロールに指定できません。'
      );

      return;
    }

    /*
     * Botの最高ロール確認
     */

    const botMember =
      member.guild.members.me;

    if (!botMember) {
      console.error(
        '❌ Bot自身のGuildMemberを取得できません。'
      );

      return;
    }

    if (
      !botMember.permissions.has(
        'ManageRoles'
      )
    ) {
      console.error(
        '❌ Botに「ロールの管理」権限がありません。'
      );

      return;
    }

    if (
      role.position >=
      botMember.roles.highest.position
    ) {
      console.error(
        `❌ 自動付与ロール「${role.name}」がBotの最高ロール以上にあります。`
      );

      return;
    }

    /*
     * 既に持っている場合
     */

    if (
      member.roles.cache.has(
        role.id
      )
    ) {
      return;
    }

    /*
     * ロール付与
     */

    await member.roles.add(
      role,
      'まぶ鯖 自動ロール'
    );

    console.log(
      `✅ 自動ロール付与: ${member.user.tag} -> ${role.name}`
    );

    /*
     * 監査ログ
     */

    await sendAuditLog({
      guild:
        member.guild,

      title:
        '🟢 自動ロール付与',

      description:
        `${member} に自動ロールを付与しました。`,

      color:
        0x57f287,

      fields: [
        {
          name: 'ユーザー',
          value:
            `${member.user.tag}\n\`${member.id}\``,
          inline: true
        },
        {
          name: 'ロール',
          value:
            `${role}\n\`${role.id}\``,
          inline: true
        }
      ]
    });

  } catch (error) {
    console.error(
      '❌ 自動ロール付与エラー:',
      error
    );
  }
}

/*
 * =========================================================
 * Welcome
 * =========================================================
 */

async function handleWelcome(
  member
) {
  try {
    const welcome =
      getWelcomeMessage(
        member.guild.id
      );

    if (!welcome) {
      return;
    }

    const channel =
      await member.guild.channels.fetch(
        welcome.channel_id
      );

    if (!channel) {
      console.warn(
        `⚠️ Welcomeチャンネルがありません: ${welcome.channel_id}`
      );

      return;
    }

    if (
      !channel.isTextBased()
    ) {
      return;
    }

    const storedEmbed =
      getStoredEmbed(
        welcome
      );

    const embeds = [];

    if (storedEmbed) {
      const embed =
        new EmbedBuilder();

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

      if (
        storedEmbed.description
      ) {
        embed.setDescription(
          String(
            storedEmbed.description
          ).slice(
            0,
            4000
          )
        );
      }

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
     * 通常content
     */

    let content =
      welcome.content || '';

    content =
      String(content)
        .replaceAll(
          '{user}',
          `<@${member.id}>`
        )
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
        content || undefined,

      embeds
    });

    console.log(
      `👋 Welcome送信: ${member.user.tag}`
    );

  } catch (error) {
    console.error(
      '❌ Welcome送信エラー:',
      error
    );
  }
}

/*
 * =========================================================
 * 参加監査ログ
 * =========================================================
 */

async function handleAuditLog(
  member
) {
  try {
    await sendAuditLog({
      guild:
        member.guild,

      title:
        '📥 メンバー参加',

      description:
        `${member} がサーバーに参加しました。`,

      color:
        0x57f287,

      fields: [
        {
          name: 'ユーザー',
          value:
            `${member.user.tag}\n\`${member.id}\``,
          inline: true
        },

        {
          name: 'アカウント作成',
          value:
            `<t:${Math.floor(
              member.user.createdTimestamp / 1000
            )}:F>`,
          inline: true
        }
      ]
    });

  } catch (error) {
    console.error(
      '❌ 参加監査ログエラー:',
      error
    );
  }
}