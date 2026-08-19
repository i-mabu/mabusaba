const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const {
  getUserCases, countUserCases, getCase, searchCases, getStats, addCaseNote
} = require('../utils/moderation');

const PAGE_SIZE=5;

module.exports={
  data:new SlashCommandBuilder().setName('moderation').setDescription('処罰履歴・Caseを管理します').setDMPermission(false)
    .addSubcommand(s=>s.setName('history').setDescription('ユーザーの処罰履歴を表示')
      .addUserOption(o=>o.setName('user').setDescription('対象ユーザー').setRequired(true))
      .addIntegerOption(o=>o.setName('page').setDescription('ページ').setMinValue(1)))
    .addSubcommand(s=>s.setName('case').setDescription('Caseの詳細を表示')
      .addIntegerOption(o=>o.setName('id').setDescription('Case ID').setRequired(true)))
    .addSubcommand(s=>s.setName('search').setDescription('Caseを検索')
      .addStringOption(o=>o.setName('query').setDescription('Case ID・ユーザー・理由など').setRequired(true))
      .addStringOption(o=>o.setName('action').setDescription('処罰種別').addChoices(
        {name:'Warn',value:'WARN'},{name:'Timeout',value:'TIMEOUT'},{name:'Kick',value:'KICK'},
        {name:'Ban',value:'BAN'},{name:'Unban',value:'UNBAN'},{name:'Untimeout',value:'UNTIMEOUT'})))
    .addSubcommand(s=>s.setName('stats').setDescription('処罰統計を表示')
      .addUserOption(o=>o.setName('user').setDescription('対象ユーザー')))
    .addSubcommand(s=>s.setName('note').setDescription('Caseに管理者メモを追加')
      .addIntegerOption(o=>o.setName('id').setDescription('Case ID').setRequired(true))),

  async execute(interaction){
    if(!interaction.inGuild()) return interaction.reply({content:'❌ サーバー内で使用してください。',ephemeral:true});
    const sub=interaction.options.getSubcommand();
    // history / case / stats は一般ユーザーにも公開。
    // search / note はモデレーター専用。
    if(sub==='history') return history(interaction,1);
    if(sub==='case') return caseDetail(interaction,interaction.options.getInteger('id'));
    if(sub==='stats') return stats(interaction);
    if(sub==='search' || sub==='note') {
      if(!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers))
        return interaction.reply({content:'❌ モデレーター権限が必要です。',ephemeral:true});
    }
    if(sub==='search') return search(interaction);
    if(sub==='note'){
      const id=interaction.options.getInteger('id');
      if(!getCase(id,interaction.guild.id)) return interaction.reply({content:'❌ Caseが見つかりません。',ephemeral:true});
      const modal=new ModalBuilder().setCustomId(`mod_note:${id}`).setTitle(`Case #${id} にメモ`);
      modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('content').setLabel('管理者メモ').setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('内部向けのメモを入力').setMaxLength(2000).setRequired(true)
      ));
      return interaction.showModal(modal);
    }
  },

  async handleButton(interaction){
    if(!interaction.customId.startsWith('mod_history:')) return false;
    const [,uid,pageStr]=interaction.customId.split(':');
    const page=Math.max(1,Number(pageStr)||1);
    await history(interaction,page,uid,true);
    return true;
  },

  async handleModal(interaction){
    if(!interaction.customId.startsWith('mod_note:')) return false;
    const id=Number(interaction.customId.split(':')[1]);
    try{
      const note=addCaseNote({
        caseId:id,guildId:interaction.guild.id,
        authorId:interaction.user.id,authorTag:interaction.user.tag,
        content:interaction.fields.getTextInputValue('content')
      });
      await interaction.reply({content:`📝 Case #${id} にメモを追加しました。（#${note.id}）`,ephemeral:true});
      return true;
    }catch(e){
      await interaction.reply({content:`❌ ${e.message}`,ephemeral:true}); return true;
    }
  }
};

async function history(interaction,page,userIdOverride=null,update=false){
  const user=userIdOverride ? await interaction.client.users.fetch(userIdOverride).catch(()=>null) : interaction.options?.getUser('user');
  if(!user) return interaction.reply({content:'❌ ユーザーが見つかりません。',ephemeral:true});
  const total=countUserCases({guildId:interaction.guild.id,userId:user.id});
  const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  page=Math.min(Math.max(page,1),pages);
  const cases=getUserCases({guildId:interaction.guild.id,userId:user.id,limit:PAGE_SIZE,offset:(page-1)*PAGE_SIZE});
  const stats=getStats(interaction.guild.id,user.id);
  const counts=Object.fromEntries(stats.byAction.map(x=>[x.action,x.count]));
  const lines=cases.length?cases.map(c=>`**#${c.id}** ${icon(c.action)} **${label(c.action)}** — ${escape(c.reason)}\n<t:${c.created_at}:f> ・ ${c.moderator_tag||c.moderator_id} ・ ${statusLabel(c.status)}`).join('\n\n'):'該当する処罰履歴はありません。';
  const embed=new EmbedBuilder().setTitle(`🛡️ ${user.tag} の処罰履歴`).setThumbnail(user.displayAvatarURL()).setColor(0x5865f2)
    .addFields({name:'📊 統計',value:`⚠️ ${counts.WARN||0} ・ 🔇 ${counts.TIMEOUT||0} ・ 👢 ${counts.KICK||0} ・ 🔨 ${counts.BAN||0}\n合計 **${total}件** / 有効 **${stats.active}件**`},
      {name:'📋 履歴',value:lines.slice(0,1024)},{name:'🔎 Case詳細',value:'Case IDを指定して `/moderation case` を使うと、個別の処罰内容を確認できます。'});
  embed.setFooter({text:`${page} / ${pages} ページ ・ Case IDはサーバー内で共有されます`}).setTimestamp();
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`mod_history:${user.id}:${page-1}`).setLabel('前へ').setStyle(ButtonStyle.Secondary).setDisabled(page<=1),
    new ButtonBuilder().setCustomId(`mod_history:${user.id}:${page+1}`).setLabel('次へ').setStyle(ButtonStyle.Secondary).setDisabled(page>=pages),
  );
  const payload={embeds:[embed],components:[row]};
  if(update) return interaction.update(payload);
  return interaction.reply(payload);
}

async function caseDetail(interaction,id){
  const c=getCase(id,interaction.guild.id);
  if(!c) return interaction.reply({content:'❌ Caseが見つかりません。',ephemeral:true});
  const embed=new EmbedBuilder().setTitle(`🛡️ Case #${c.id}`).setColor(color(c.action)).addFields(
    {name:'👤 対象',value:`${c.user_tag||`<@${c.user_id}>`}\n\`${c.user_id}\``,inline:true},
    {name:'🛡️ 処罰',value:`${icon(c.action)} ${label(c.action)}`,inline:true},
    {name:'👮 実行者',value:`${c.moderator_tag}\n\`${c.moderator_id}\``,inline:true},
    {name:'📝 理由',value:escape(c.reason).slice(0,1024)},
    {name:'📅 日時',value:`<t:${c.created_at}:F>`,inline:true},
    {name:'📌 状態',value:statusLabel(c.status),inline:true},
  ).setTimestamp();
  if(c.duration) embed.addFields({name:'⏱️ 期間',value:formatDuration(c.duration),inline:true});
  if(c.expires_at) embed.addFields({name:'⏰ 終了予定',value:`<t:${c.expires_at}:F>`,inline:true});
  if(c.channel_id) embed.addFields({name:'📍 チャンネル',value:`<#${c.channel_id}>`,inline:true});
  return interaction.reply({embeds:[embed]});
}

async function search(interaction){
  const rows=searchCases({guildId:interaction.guild.id,query:interaction.options.getString('query'),action:interaction.options.getString('action'),limit:20});
  if(!rows.length) return interaction.reply({content:'🔎 該当するCaseはありません。',ephemeral:true});
  const embed=new EmbedBuilder().setTitle('🔎 Case検索').setColor(0x5865f2)
    .setDescription(rows.map(c=>`**#${c.id}** ${icon(c.action)} ${label(c.action)}\n${escape(c.reason)}\n${c.user_tag||c.user_id} ・ <t:${c.created_at}:f> ・ ${statusLabel(c.status)}`).join('\n\n').slice(0,4096))
    .setFooter({text:`${rows.length}件表示`}).setTimestamp();
  return interaction.reply({embeds:[embed],ephemeral:true});
}

async function stats(interaction){
  const user=interaction.options.getUser('user');
  const s=getStats(interaction.guild.id,user?.id);
  const lines=s.byAction.map(x=>`${icon(x.action)} ${label(x.action)}: **${x.count}**`).join('\n')||'データなし';
  const embed=new EmbedBuilder().setTitle(`📊 ${user?`${user.tag} `:''}処罰統計`).setColor(0x5865f2)
    .addFields({name:'合計',value:`**${s.total}件**` ,inline:true},{name:'有効',value:`**${s.active}件**`,inline:true},{name:'種別',value:lines});
  return interaction.reply({embeds:[embed]});
}
function icon(a){return ({WARN:'⚠️',TIMEOUT:'🔇',KICK:'👢',BAN:'🔨',UNBAN:'🔓',UNTIMEOUT:'🔊'})[a]||'🛡️'}
function label(a){return ({WARN:'Warn',TIMEOUT:'Timeout',KICK:'Kick',BAN:'Ban',UNBAN:'Unban',UNTIMEOUT:'Untimeout'})[a]||a}
function statusLabel(s){return s==='active'?'🟢 有効':s==='closed'?'⚪ 終了':`🟡 ${s}`}
function color(a){return ({WARN:0xfee75c,TIMEOUT:0xfee75c,KICK:0xe67e22,BAN:0xed4245,UNBAN:0x57f287})[a]||0x5865f2}
function formatDuration(sec){const m=Math.floor(sec/60); if(m<60)return `${m}分`; const h=Math.floor(m/60); if(h<24)return `${h}時間`; return `${Math.floor(h/24)}日${h%24?`${h%24}時間`:''}`}
function escape(s){return String(s||'').replace(/([\\`*_{}[\]()<>#+\-.!|])/g,'\\$1')}
