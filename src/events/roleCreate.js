const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'roleCreate',once:false,async execute(role){
 await sendAuditLog({guild:role.guild,type:'ROLE',action:'CREATE',target:{id:role.id,tag:role.name},title:'➕ ロール作成',color:0x57f287,description:`@${role.name} が作成されました。`,fields:[{name:'ID',value:role.id}]});
}};
