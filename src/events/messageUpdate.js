const { sendAuditLog } = require('../utils/auditLog');
module.exports={name:'messageUpdate',once:false,async execute(oldMessage,newMessage){
  if(!newMessage.guild||newMessage.author?.bot)return;
  if(oldMessage.content===newMessage.content)return;
  await sendAuditLog({
    guild:newMessage.guild,type:'MESSAGE',action:'EDIT',target:newMessage.author||null,channel:newMessage.channel,message:newMessage,
    title:'✏️ メッセージ編集',color:0x5865f2,
    description:`${newMessage.author||'不明'} がメッセージを編集しました。`,
    fields:[
      {name:'チャンネル',value:`${newMessage.channel}`,inline:true},
      {name:'変更前',value:(oldMessage.content||'取得不可').slice(0,1024)},
      {name:'変更後',value:(newMessage.content||'取得不可').slice(0,1024)}
    ],
    data:{before:oldMessage.content||null,after:newMessage.content||null}
  });
}};
