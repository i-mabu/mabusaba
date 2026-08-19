const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'channelDelete',once:false,async execute(channel){
 if(!channel.guild)return;
 await sendAuditLog({guild:channel.guild,type:'CHANNEL',action:'DELETE',target:{id:channel.id,tag:channel.name},title:'🗑️ チャンネル削除',color:0xed4245,description:`#${channel.name} が削除されました。`,fields:[{name:'ID',value:channel.id}]});
}};
