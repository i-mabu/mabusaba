<<<<<<< Updated upstream
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
=======
const { sendAuditLog, fetchAuditEntry } = require('../utils/auditLog');
const { AuditLogEvent } = require('discord.js');
const { closeLatestActiveCase } = require('../utils/moderation');

module.exports = {
  name:'guildMemberUpdate', once:false,
  async execute(oldMember,newMember){
    try{
      const oldRoles=oldMember.roles.cache, newRoles=newMember.roles.cache;
      const added=newRoles.filter(r=>!oldRoles.has(r.id));
      const removed=oldRoles.filter(r=>!newRoles.has(r.id));
      const executorEntry=await fetchAuditEntry({
        guild:newMember.guild,type:AuditLogEvent.MemberRoleUpdate,targetId:newMember.id,maxAge:15000
      });
      const executor=executorEntry?.executor||null;
      if(added.size){
        await sendAuditLog({
          guild:newMember.guild,type:'ROLE',action:'MEMBER_ROLE_ADD',actor:executor,target:newMember.user,
          title:'➕ ロール付与',color:0x57f287,description:`${newMember} にロールが付与されました。`,
          fields:[
            {name:'対象',value:`${newMember.user.tag}\n\`${newMember.id}\``,inline:true},
            {name:'実行者',value:executor?`${executor.tag}\n\`${executor.id}\``:'不明',inline:true},
            {name:'ロール',value:added.map(r=>`${r} \`${r.id}\``).join('\n').slice(0,1024)}
          ]
        });
      }
      if(removed.size){
        await sendAuditLog({
          guild:newMember.guild,type:'ROLE',action:'MEMBER_ROLE_REMOVE',actor:executor,target:newMember.user,
          title:'➖ ロール削除',color:0xed4245,description:`${newMember} からロールが削除されました。`,
          fields:[
            {name:'対象',value:`${newMember.user.tag}\n\`${newMember.id}\``,inline:true},
            {name:'実行者',value:executor?`${executor.tag}\n\`${executor.id}\``:'不明',inline:true},
            {name:'ロール',value:removed.map(r=>`${r} \`${r.id}\``).join('\n').slice(0,1024)}
          ]
        });
      }
      if(oldMember.nickname!==newMember.nickname){
        await sendAuditLog({
          guild:newMember.guild,type:'MEMBER',action:'NICKNAME_UPDATE',actor:executor,target:newMember.user,
          title:'✏️ ニックネーム変更',color:0x5865f2,description:`${newMember} のニックネームが変更されました。`,
          fields:[
            {name:'変更前',value:oldMember.nickname||'なし',inline:true},
            {name:'変更後',value:newMember.nickname||'なし',inline:true},
            {name:'実行者',value:executor?`${executor.tag}`:'不明',inline:true}
          ]
        });
      }
      const oldTimeout=oldMember.communicationDisabledUntilTimestamp||0;
      const newTimeout=newMember.communicationDisabledUntilTimestamp||0;
      if(oldTimeout!==newTimeout){
        let timeoutCaseId=null;
        if(!newTimeout){
          timeoutCaseId=closeLatestActiveCase({guildId:newMember.guild.id,userId:newMember.id,action:'TIMEOUT'});
        }
        await sendAuditLog({
          guild:newMember.guild,type:'MODERATION',action:newTimeout?'TIMEOUT_UPDATE':'UNTIMEOUT',
          actor:executor,target:newMember.user,caseId:timeoutCaseId,title:newTimeout?'🔇 Timeout':'🔊 Timeout解除',
          color:newTimeout?0xfee75c:0x57f287,
          fields:[{name:'対象',value:`${newMember.user.tag}\n\`${newMember.id}\``},{name:'終了',value:newTimeout?`<t:${Math.floor(newTimeout/1000)}:F>`:'解除済み'}]
        });
      }
    }catch(error){ console.error('❌ メンバー変更監査ログエラー:',error); }
  }
};
>>>>>>> Stashed changes
