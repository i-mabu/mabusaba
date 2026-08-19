const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { closeLatestTimeout } = require('../utils/modAction');

module.exports = {
  data:new SlashCommandBuilder().setName('unmute').setDescription('Timeoutを解除します')
    .addUserOption(o=>o.setName('user').setDescription('対象ユーザー').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction){
    if(!isModerator(interaction.member)) return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    const user=interaction.options.getUser('user');
    const member=await interaction.guild.members.fetch(user.id).catch(()=>null);
    if(!member) return interaction.reply({content:'❌ 対象メンバーが見つかりません。',ephemeral:true});
    if(!member.moderatable) return interaction.reply({content:'❌ このメンバーを操作できません。',ephemeral:true});
    await member.timeout(null,`Timeout解除 / ${interaction.user.tag}`);
    const caseId=await closeLatestTimeout({interaction,user});
    return interaction.reply({content:`🔊 ${user.tag} のTimeoutを解除しました.${caseId?`\nCase #${caseId} を終了しました。`:''}`});
  }
};
