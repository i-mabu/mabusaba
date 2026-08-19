const {
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const {
  getWelcomeMessage,
  getStoredEmbed,
} = require('../utils/welcomeMessage');

const {
  sendAuditLog,
} = require('../utils/auditLog');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member) {
    console.log(
      `📥 guildMemberAdd: ${member.user.tag} (${member.id})`
    );

    /*
     * 自動ロール
     */

    try {
      await handleAutoRole(
        member
      );
    } catch (error) {
      console.error(
        '❌ 自動ロール処理失敗:',
        error
      );
    }

    /*
     * Welcome
     */

    try {
      await handleWelcome(
        member
      );
    } catch (error) {
      console.error(
        '❌ Welcome処理失敗:',
        error
      );
    }

    /*
     * 参加監査ログ
     */

    try {
      await sendAuditLog({
<<<<<<< Updated upstream
=======
        type: 'MEMBER',
        action: 'JOIN',
        actor: member.user,
        target: member.user,
>>>>>>> Stashed changes
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
            inline: true,
          },

          {
            name: 'アカウント作成',
            value:
              `<t:${Math.floor(
                member.user.createdTimestamp /
                  1000
              )}:F>`,
            inline: true,
          },
        ],
      });
    } catch (error) {
      console.error(
        '❌ 参加監査ログ失敗:',
        error
      );
    }
  },
};

/*
 * =========================================================
 * 自動ロール
 * =========================================================
 */

async function handleAutoRole(
  member
) {
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

  if (
    role.id ===
    member.guild.id
  ) {
    console.error(
      '❌ @everyone は自動ロールに設定できません。'
    );

    return;
  }

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
      PermissionFlagsBits.ManageRoles
    )
  ) {
    console.error(
      '❌ Botに「ロールの管理」権限がありません。'
    );

    return;
  }

  if (
    role.managed
  ) {
    console.error(
      `❌ 管理ロールは付与できません: ${role.name}`
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

  if (
    member.roles.cache.has(
      role.id
    )
  ) {
    console.log(
      `ℹ️ 既にロールを所持: ${member.user.tag} -> ${role.name}`
    );

    return;
  }

  await member.roles.add(
    role,
    'まぶ鯖 自動ロール'
  );

  console.log(
    `✅ 自動ロール付与: ${member.user.tag} -> ${role.name}`
  );

  await sendAuditLog({
<<<<<<< Updated upstream
=======
    type: 'MEMBER',
    action: 'AUTO_ROLE_ADD',
    actor: null,
    target: member.user,
>>>>>>> Stashed changes
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
        inline: true,
      },

      {
        name: 'ロール',
        value:
          `${role}\n\`${role.id}\``,
        inline: true,
      },

      {
        name: '実行者',
        value:
          '🤖 まぶ鯖Bot（自動）',
        inline: true,
      },
    ],
  });
}

/*
 * =========================================================
 * Welcome
 * =========================================================
 */

async function handleWelcome(
  member
) {
  const welcome =
    getWelcomeMessage(
      member.guild.id
    );

  if (!welcome) {
    console.log(
      'ℹ️ Welcome設定なし'
    );

    return;
  }

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

  const me =
    member.guild.members.me;

  if (me) {
    const permissions =
      channel.permissionsFor(me);

    if (
      !permissions?.has(
        PermissionFlagsBits.ViewChannel
      ) ||
      !permissions?.has(
        PermissionFlagsBits.SendMessages
      )
    ) {
      console.error(
        '❌ Welcomeチャンネルへの送信権限がありません。'
      );

      return;
    }
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
        )
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
          )
          .slice(
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
        size: 256,
      })
    );

    embeds.push(
      embed
    );
  }

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

    embeds,

    allowedMentions: {
      users: [
        member.id
      ],
    },
  });

  console.log(
    `👋 Welcome送信: ${member.user.tag}`
  );
}