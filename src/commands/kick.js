const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { recordModeration } = require('../utils/modAction');

module.exports = {
  data:new SlashCommandBuilder().setName('kick').setDescription('メンバーをKickします')
    .addUserOption(o=>o.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction){
    if(!isModerator(interaction.member)) return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    const user=interaction.options.getUser('user');
    const reason=interaction.options.getString('reason')||'理由なし';
    const member=await interaction.guild.members.fetch(user.id).catch(()=>null);
    if(!member) return interaction.reply({content:'❌ 対象メンバーが見つかりません。',ephemeral:true});
    if(!member.kickable) return interaction.reply({content:'❌ このメンバーをKickできません。',ephemeral:true});
    await member.kick(`${reason} / ${interaction.user.tag}`);
    const c=await recordModeration({interaction,user,action:'KICK',reason,status:'closed',title:'👢 Kick',color:0xe67e22,description:`${user} をKickしました。`});
    return interaction.reply({content:`👢 ${user.tag} をKickしました。\nCase #${c.id}`});
  }
};
