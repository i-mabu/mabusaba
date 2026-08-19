const {
  sendAuditLog,
} = require('../utils/auditLog');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(member) {
    try {
      console.log(
        `📤 guildMemberRemove: ${member.user.tag} (${member.id})`
      );

      await sendAuditLog({
        type: 'MEMBER',
        action: 'LEAVE',
        target: member.user,
        guild:
          member.guild,

        title:
          '📤 メンバー退出',

        description:
          `${member.user.tag} がサーバーから退出しました。`,

        color:
          0xed4245,

        fields: [
          {
            name: 'ユーザー',
            value:
              `${member.user.tag}\n\`${member.id}\``,
            inline: true,
          },

          {
            name: '参加日時',
            value:
              member.joinedTimestamp
                ? `<t:${Math.floor(
                    member.joinedTimestamp /
                      1000
                  )}:F>`
                : '不明',
            inline: true,
          },
        ],
      });
    } catch (error) {
      console.error(
        '❌ 退出監査ログエラー:',
        error
      );
    }
  },
};