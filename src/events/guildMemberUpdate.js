const {
  EmbedBuilder
} = require('discord.js');

const {
  sendAuditLog
} = require('../utils/auditLog');

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

      /*
       * 追加されたロール
       */

      const addedRoles =
        newRoles.filter(
          role =>
            !oldRoles.has(
              role.id
            )
        );

      /*
       * 削除されたロール
       */

      const removedRoles =
        oldRoles.filter(
          role =>
            !newRoles.has(
              role.id
            )
        );

      /*
       * 変更なし
       */

      if (
        addedRoles.size === 0 &&
        removedRoles.size === 0
      ) {
        return;
      }

      /*
       * 追加
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
              name: 'ユーザー',
              value:
                `${newMember.user.tag}\n\`${newMember.id}\``
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
                  )
            }
          ]
        });
      }

      /*
       * 削除
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
              name: 'ユーザー',
              value:
                `${newMember.user.tag}\n\`${newMember.id}\``
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
                  )
            }
          ]
        });
      }

    } catch (error) {
      console.error(
        '❌ ロール変更監査ログエラー:',
        error
      );
    }
  }
};