const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { searchAuditLogs } = require('../utils/moderation');

module.exports={
 data:new SlashCommandBuilder().setName('audit-log').setDescription('Bot監査ログを検索します').setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
  .addStringOption(o=>o.setName('type').setDescription('ログ種別').addChoices(
    {name:'Moderation',value:'MODERATION'},{name:'Member',value:'MEMBER'},{name:'Message',value:'MESSAGE'},
    {name:'Channel',value:'CHANNEL'},{name:'Role',value:'ROLE'},{name:'Server',value:'SERVER'},
    {name:'Bot',value:'BOT'},{name:'Game',value:'GAME'},{name:'System',value:'SYSTEM'}))
  .addStringOption(o=>o.setName('query').setDescription('操作・ユーザー・理由など'))
  .addUserOption(o=>o.setName('user').setDescription('対象ユーザー')),
 async execute(interaction){
  const rows=searchAuditLogs({guildId:interaction.guild.id,type:interaction.options.getString('type'),query:interaction.options.getString('query'),targetId:interaction.options.getUser('user')?.id,limit:25});
  if(!rows.length)return interaction.reply({content:'🔎 該当する監査ログはありません。',ephemeral:true});
  const lines=rows.map(r=>`**#${r.id}** \`${r.type}/${r.action}\`\n${r.target_tag||r.target_id||'対象なし'} ・ ${r.actor_tag||r.actor_id||'不明'}\n${r.reason?`理由: ${r.reason}\n`:''}<t:${r.created_at}:f>${r.case_id?` ・ Case #${r.case_id}`:''}`).join('\n\n');
  const embed=new EmbedBuilder().setTitle('📜 Bot監査ログ').setDescription(lines.slice(0,4096)).setColor(0x5865f2).setFooter({text:`最新${rows.length}件`}).setTimestamp();
  return interaction.reply({embeds:[embed],ephemeral:true});
 }
};
