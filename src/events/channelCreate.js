const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'channelCreate',once:false,async execute(channel){
 if(!channel.guild)return;
 await sendAuditLog({guild:channel.guild,type:'CHANNEL',action:'CREATE',target:{id:channel.id,tag:channel.name},title:'📁 チャンネル作成',color:0x57f287,description:`#${channel.name} が作成されました。`,fields:[{name:'ID',value:channel.id}]});
}};
