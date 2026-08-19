const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { recordModeration } = require('../utils/modAction');

module.exports = {
  data:new SlashCommandBuilder().setName('unban').setDescription('BANを解除します')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o=>o.setName('user').setDescription('ユーザーID').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('理由')),
  async execute(interaction){
    if(!isModerator(interaction.member)) return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    const id=interaction.options.getString('user').trim();
    const reason=interaction.options.getString('reason')||'BAN解除';
    const ban=await interaction.guild.bans.fetch(id).catch(()=>null);
    if(!ban) return interaction.reply({content:'❌ そのユーザーはBANされていません。',ephemeral:true});
    await interaction.guild.members.unban(id,`${reason} / ${interaction.user.tag}`);
    const c=await recordModeration({interaction,user:ban.user,action:'UNBAN',reason,status:'closed',title:'🔓 Unban',color:0x57f287,description:`${ban.user.tag} のBANを解除しました.`});
    return interaction.reply({content:`🔓 ${ban.user.tag} のBANを解除しました。\nCase #${c.id}`});
  }
};
