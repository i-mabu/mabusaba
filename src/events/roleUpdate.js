const { sendAuditLog }=require('../utils/auditLog');
module.exports={name:'roleUpdate',once:false,async execute(oldRole,newRole){
 if(oldRole.name===newRole.name && oldRole.color===newRole.color && oldRole.permissions.bitfield===newRole.permissions.bitfield)return;
 const changes=[];
 if(oldRole.name!==newRole.name) changes.push(`名前: ${oldRole.name} → ${newRole.name}`);
 if(oldRole.color!==newRole.color) changes.push('色を変更');
 if(oldRole.permissions.bitfield!==newRole.permissions.bitfield) changes.push('権限を変更');
 await sendAuditLog({guild:newRole.guild,type:'ROLE',action:'UPDATE',target:{id:newRole.id,tag:newRole.name},title:'✏️ ロール変更',color:0x5865f2,description:`@${newRole.name} が変更されました。`,fields:[{name:'変更',value:changes.join('\n').slice(0,1024)}]});
}};
