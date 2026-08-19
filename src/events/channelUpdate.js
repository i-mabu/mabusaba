const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'channelUpdate',once:false,async execute(oldChannel,newChannel){
 if(!newChannel.guild)return;
 const changes=[];
 if(oldChannel.name!==newChannel.name) changes.push(`名前: ${oldChannel.name} → ${newChannel.name}`);
 if(oldChannel.topic!==newChannel.topic) changes.push(`トピック: ${(oldChannel.topic||'なし')} → ${(newChannel.topic||'なし')}`);
 if(!changes.length)return;
 await sendAuditLog({guild:newChannel.guild,type:'CHANNEL',action:'UPDATE',target:{id:newChannel.id,tag:newChannel.name},title:'✏️ チャンネル変更',color:0x5865f2,description:`#${newChannel.name} が変更されました。`,fields:[{name:'変更',value:changes.join('\n').slice(0,1024)}]});
}};
