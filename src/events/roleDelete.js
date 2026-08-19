const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'roleDelete',once:false,async execute(role){
 await sendAuditLog({guild:role.guild,type:'ROLE',action:'DELETE',target:{id:role.id,tag:role.name},title:'➖ ロール削除',color:0xed4245,description:`@${role.name} が削除されました。`,fields:[{name:'ID',value:role.id}]});
}};
