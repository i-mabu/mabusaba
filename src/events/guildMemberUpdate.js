const {
  sendAuditLog,
  fetchAuditEntry,
} = require('../utils/auditLog');

const {
  AuditLogEvent,
} = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  once: false,

  async execute(
    oldMember,
    newMember
  ) {
    try {
      const oldRoles =
        oldMember.roles.cache;

      const newRoles =
        newMember.roles.cache;

      const addedRoles =
        newRoles.filter(
          role =>
            !oldRoles.has(
              role.id
            )
        );

      const removedRoles =
        oldRoles.filter(
          role =>
            !newRoles.has(
              role.id
            )
        );

      if (
        addedRoles.size === 0 &&
        removedRoles.size === 0
      ) {
        return;
      }

      /*
       * Discordの監査ログから
       * 誰が操作したかを取得
       */

      const auditEntry =
        await fetchAuditEntry({
          guild:
            newMember.guild,

          type:
            AuditLogEvent.MemberRoleUpdate,

          targetId:
            newMember.id,

          maxAge:
            15000,
        });

      const executor =
        auditEntry?.executor;

      /*
       * ロール追加
       */

      if (
        addedRoles.size > 0
      ) {
        await sendAuditLog({
          guild:
            newMember.guild,

          title:
            '➕ ロール付与',

          description:
            `${newMember} にロールが付与されました。`,

          color:
            0x57f287,

          fields: [
            {
              name: '対象ユーザー',
              value:
                `${newMember.user.tag}\n\`${newMember.id}\``,
            },

            {
              name: '実行者',
              value:
                executor
                  ? `${executor.tag}\n\`${executor.id}\``
                  : '不明',
            },

            {
              name: '追加されたロール',
              value:
                addedRoles
                  .map(
                    role =>
                      `${role} \`${role.id}\``
                  )
                  .join('\n')
                  .slice(
                    0,
                    1024
                  ),
            },
          ],
        });
      }

      /*
       * ロール削除
       */

      if (
        removedRoles.size > 0
      ) {
        await sendAuditLog({
          guild:
            newMember.guild,

          title:
            '➖ ロール削除',

          description:
            `${newMember} からロールが削除されました。`,

          color:
            0xed4245,

          fields: [
            {
              name: '対象ユーザー',
              value:
                `${newMember.user.tag}\n\`${newMember.id}\``,
            },

            {
              name: '実行者',
              value:
                executor
                  ? `${executor.tag}\n\`${executor.id}\``
                  : '不明',
            },

            {
              name: '削除されたロール',
              value:
                removedRoles
                  .map(
                    role =>
                      `${role} \`${role.id}\``
                  )
                  .join('\n')
                  .slice(
                    0,
                    1024
                  ),
            },
          ],
        });
      }

    } catch (error) {
      console.error(
        '❌ ロール変更監査ログエラー:',
        error
      );
    }
  },
};