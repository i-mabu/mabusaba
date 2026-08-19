const { sendAuditLog } = require('../utils/auditLog');
module.exports={name:'messageDelete',once:false,async execute(message){
  if(!message.guild||message.author?.bot)return;
  await sendAuditLog({
    guild:message.guild,type:'MESSAGE',action:'DELETE',actor:null,target:message.author||null,channel:message.channel,message,
    title:'🗑️ メッセージ削除',color:0xed4245,
    description:`${message.author||'不明'} のメッセージが削除されました。`,
    fields:[
      {name:'チャンネル',value:`${message.channel} \`${message.channelId}\``,inline:true},
      {name:'内容',value:(message.content||'取得できませんでした').slice(0,1024)}
    ],
    data:{content:message.content||null}
  });
}};
