const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { recordModeration } = require('../utils/modAction');

module.exports = {
  data:new SlashCommandBuilder().setName('ban').setDescription('メンバーをBANします')
    .addUserOption(o=>o.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction){
    if(!isModerator(interaction.member)) return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    const user=interaction.options.getUser('user');
    const reason=interaction.options.getString('reason')||'理由なし';
    const member=await interaction.guild.members.fetch(user.id).catch(()=>null);
    if(member && !member.bannable) return interaction.reply({content:'❌ このメンバーをBANできません。',ephemeral:true});
    await interaction.guild.members.ban(user.id,{reason:`${reason} / ${interaction.user.tag}`});
    const c=await recordModeration({interaction,user,action:'BAN',reason,title:'🔨 BAN',color:0xed4245,description:`${user} をBANしました。`});
    return interaction.reply({content:`🔨 ${user.tag} をBANしました。\nCase #${c.id}`});
  }
};
