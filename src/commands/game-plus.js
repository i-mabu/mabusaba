const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
}=require('discord.js');
const { start:bjStart, hit:bjHit, result:bjResult, dealerPlay:bjDealer }=require('../games/blackjack');
const { spin }=require('../games/roulette');
const { random:quizRandom }=require('../games/quiz');
const { start:numStart }=require('../games/numberGuess');
const { finishGame }=require('../utils/gameManager');

const sessions=new Map();

module.exports={
 data:new SlashCommandBuilder().setName('game-plus').setDescription('拡張ミニゲームを遊びます').setDMPermission(false)
   .addSubcommand(s=>s.setName('blackjack').setDescription('ブラックジャック'))
   .addSubcommand(s=>s.setName('roulette').setDescription('ルーレット'))
   .addSubcommand(s=>s.setName('quiz').setDescription('4択クイズ'))
   .addSubcommand(s=>s.setName('numberguess').setDescription('1〜6の数字当て')),
 async execute(interaction){
   const game=interaction.options.getSubcommand();
   await interaction.reply({embeds:[new EmbedBuilder().setTitle('🎮 '+gameName(game)).setDescription('ゲームを開始します。').setColor(0x5865f2)],components:[]});
   const message=await interaction.fetchReply();
   const state={game,userId:interaction.user.id};
   if(game==='blackjack') state.data=bjStart();
   if(game==='quiz') state.data=quizRandom();
   if(game==='numberguess') state.data=numStart();
   sessions.set(message.id,state);
   await render(interaction,message,state);
 },
 async handleButton(interaction){
   const state=sessions.get(interaction.message.id);
   if(!state||!interaction.customId.startsWith('gp:')) return false;
   if(interaction.user.id!==state.userId){await interaction.reply({content:'❌ このゲームを開始したユーザー以外は操作できません。',ephemeral:true});return true;}
   const action=interaction.customId.split(':')[1];
   try{
     if(state.game==='blackjack'){
       if(action==='hit'){
         bjHit(state.data);
         if(state.data.total>21){
           const result='lose'; const r=await finishGame({interaction,game:'blackjack',result,metadata:{player:state.data.player,dealer:state.data.dealer}});
           return end(interaction,state,`💥 バースト！合計 ${state.data.total}`,result,r);
         }
         return render(interaction,interaction.message,state);
       }
       if(action==='stand'){
         const result=bjResult(state.data);
         const r=await finishGame({interaction,game:'blackjack',result,metadata:{player:state.data.player,dealer:state.data.dealer}});
         return end(interaction,state,`結果：あなた ${state.data.total} / Dealer ${state.data.dealerTotal}`,result,r);
       }
     }
     if(state.game==='roulette'){
       if(!['red','black','green'].includes(action)) return true;
       const s=spin(); const win=s.color===action; const r=await finishGame({interaction,game:'roulette',result:win?'win':'lose',metadata:{choice:action,number:s.number,color:s.color}});
       return end(interaction,state,`出目：**${s.number} ${s.color}**\nあなたの選択：**${action}**`,win?'win':'lose',r);
     }
     if(state.game==='quiz'){
       const idx=Number(action);
       const correct=idx===state.data.correct;
       const r=await finishGame({interaction,game:'quiz',result:correct?'win':'lose',metadata:{question:state.data.q,choice:idx,correct:state.data.correct}});
       return end(interaction,state,`${correct?'🎉 正解！':'❌ 不正解…'}\n正解：**${state.data.a[state.data.correct]}**`,correct?'win':'lose',r);
     }
     if(state.game==='numberguess'){
       const n=Number(action); state.data.tries++;
       if(n===state.data.answer){
         const r=await finishGame({interaction,game:'numberguess',result:'win',metadata:{answer:state.data.answer,tries:state.data.tries}});
         return end(interaction,state,`🎯 正解！答えは **${state.data.answer}** でした。`, 'win',r);
       }
       if(state.data.tries>=3){
         const r=await finishGame({interaction,game:'numberguess',result:'lose',metadata:{answer:state.data.answer,tries:state.data.tries}});
         return end(interaction,state,`💥 3回使い切りました。答えは **${state.data.answer}** でした。`,'lose',r);
       }
       const hint=n<state.data.answer?'⬆️ もっと大きい':'⬇️ もっと小さい';
       return interaction.update({embeds:[baseEmbed(state).setDescription(`${hint}\n残り **${3-state.data.tries}回**`)],components:[numberRow()]});
     }
   }catch(e){
     console.error('❌ game-plus:',e);
     if(!interaction.replied&&!interaction.deferred) await interaction.reply({content:'❌ ゲーム処理中にエラーが発生しました。',ephemeral:true});
   }
   return true;
 }
};

function gameName(g){return ({blackjack:'ブラックジャック',roulette:'ルーレット',quiz:'クイズ',numberguess:'数字当て'})[g]||g;}
function baseEmbed(state){return new EmbedBuilder().setTitle(`🎮 ${gameName(state.game)}`).setColor(0x5865f2);}
async function render(interaction,message,state){
 let embed=baseEmbed(state), row;
 if(state.game==='blackjack'){
   embed.setDescription(`あなた：**${state.data.player.join(' / ')}** = **${state.data.total}**\nDealer：**${state.data.dealer[0]} / ?**\n\nヒットするかスタンドしてください。`);
   row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gp:hit').setLabel('Hit').setEmoji('🃏').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('gp:stand').setLabel('Stand').setEmoji('✋').setStyle(ButtonStyle.Success)
   );
 }
 if(state.game==='roulette'){
   embed.setDescription('色を選んでルーレットを回します。');
   row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gp:red').setLabel('赤').setEmoji('🔴').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('gp:black').setLabel('黒').setEmoji('⚫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('gp:green').setLabel('緑').setEmoji('🟢').setStyle(ButtonStyle.Success)
   );
 }
 if(state.game==='quiz'){
   embed.setDescription(`❓ ${state.data.q}`);
   row=new ActionRowBuilder().addComponents(state.data.a.map((a,i)=>new ButtonBuilder().setCustomId(`gp:${i}`).setLabel(a.slice(0,80)).setStyle(ButtonStyle.Primary)));
 }
 if(state.game==='numberguess'){
   embed.setDescription('1〜6から数字を選んでください。残り3回。'); row=numberRow();
 }
 return interaction.message ? interaction.update({embeds:[embed],components:[row]}) : message.edit({embeds:[embed],components:[row]});
}
function numberRow(){return new ActionRowBuilder().addComponents([1,2,3,4,5,6].map(n=>new ButtonBuilder().setCustomId(`gp:${n}`).setLabel(String(n)).setStyle(ButtonStyle.Secondary)));}
async function end(interaction,state,text,result,r){
 sessions.delete(interaction.message.id);
 const icon=result==='win'?'🎉':result==='lose'?'😢':'🤝';
 const embed=baseEmbed(state).setDescription(`${text}\n\n${icon} **${result.toUpperCase()}**`).addFields(
  {name:'ポイント変動',value:r.points>=0?`+${r.points}pt`:`${r.points}pt`,inline:true},
  {name:'所持ポイント',value:`${r.data.points}pt`,inline:true}
 ).setTimestamp();
 return interaction.update({embeds:[embed],components:[]});
}
