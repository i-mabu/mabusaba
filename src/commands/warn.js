const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../utils/permissions');
const { recordModeration } = require('../utils/modAction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn').setDescription('メンバーに警告します')
    .addUserOption(o => o.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('理由').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!isModerator(interaction.member))
      return interaction.reply({ content:'❌ モデレーター権限が必要です。', ephemeral:true });
    const user=interaction.options.getUser('user');
    const reason=interaction.options.getString('reason');
    const c=await recordModeration({
      interaction,user,action:'WARN',reason,
      title:'⚠️ Warn',color:0xfee75c,
      description:`${user} に警告を記録しました。`,
    });
    return interaction.reply({ content:`⚠️ ${user.tag} に警告しました。\nCase #${c.id}` });
  }
};
