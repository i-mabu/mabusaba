const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { recordModeration } = require('../utils/modAction');

module.exports = {
  data:new SlashCommandBuilder().setName('mute').setDescription('メンバーをタイムアウトします')
    .addUserOption(o=>o.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addIntegerOption(o=>o.setName('minutes').setDescription('時間（分）').setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction){
    if(!isModerator(interaction.member)) return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    const user=interaction.options.getUser('user');
    const minutes=interaction.options.getInteger('minutes');
    const reason=interaction.options.getString('reason')||'理由なし';
    const member=await interaction.guild.members.fetch(user.id).catch(()=>null);
    if(!member) return interaction.reply({content:'❌ 対象メンバーが見つかりません。',ephemeral:true});
    if(!member.moderatable) return interaction.reply({content:'❌ このメンバーをTimeoutできません。',ephemeral:true});
    const expiresAt=Math.floor(Date.now()/1000)+minutes*60;
    await member.timeout(minutes*60*1000,`${reason} / ${interaction.user.tag}`);
    const c=await recordModeration({interaction,user,action:'TIMEOUT',reason,duration:minutes*60,expiresAt,title:'🔇 Timeout',color:0xfee75c,description:`${user} を${minutes}分Timeoutしました.`});
    return interaction.reply({content:`🔇 ${user.tag} を${minutes}分Timeoutしました。\nCase #${c.id}`});
  }
};
