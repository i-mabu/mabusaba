const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const {
  getUser,
  recordGame,
} = require('../utils/gameData');

const {
  playDice,
} = require('../games/dice');

const {
  playCoin,
} = require('../games/coin');

const {
  playRps,
} = require('../games/rps');

const {
  playHighLow,
} = require('../games/highlow');

const {
  playSlots,
} = require('../games/slots');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('まぶ鯖ミニゲーム'),

  async execute(interaction) {
    const user = getUser(
      interaction.user.id,
      interaction.user.username
    );

    const menuEmbed =
      new EmbedBuilder()
        .setTitle('🎮 まぶ鯖ミニゲーム')
        .setDescription(
          '遊びたいゲームを選択してください！\n\n' +
          `💰 所持ポイント: **${user.points}pt**`
        )
        .addFields({
          name: '🎲 ゲーム一覧',
          value:
            '🎲 サイコロ\n' +
            '🪙 コイントス\n' +
            '✊ じゃんけん\n' +
            '🎯 HIGH & LOW\n' +
            '🎰 スロット',
        })
        .setColor(0x5865f2);

    const row1 =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game_dice')
            .setLabel('サイコロ')
            .setEmoji('🎲')
            .setStyle(
              ButtonStyle.Primary
            ),

          new ButtonBuilder()
            .setCustomId('game_coin')
            .setLabel('コイン')
            .setEmoji('🪙')
            .setStyle(
              ButtonStyle.Primary
            ),

          new ButtonBuilder()
            .setCustomId('game_rps')
            .setLabel('じゃんけん')
            .setEmoji('✊')
            .setStyle(
              ButtonStyle.Success
            )
        );

    const row2 =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game_high')
            .setLabel('HIGH')
            .setEmoji('⬆️')
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId('game_low')
            .setLabel('LOW')
            .setEmoji('⬇️')
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId('game_slots')
            .setLabel('スロット')
            .setEmoji('🎰')
            .setStyle(
              ButtonStyle.Danger
            )
        );

    await interaction.reply({
      embeds: [menuEmbed],
      components: [
        row1,
        row2,
      ],
    });

    const message =
      await interaction.fetchReply();

    const collector =
      message.createMessageComponentCollector({
        time: 120000,
      });

    collector.on(
      'collect',
      async button => {
        /*
         * 他人の操作を禁止
         */

        if (
          button.user.id !==
          interaction.user.id
        ) {
          return button.reply({
            content:
              '❌ このゲームを開始したユーザー以外は操作できません。',
            ephemeral: true,
          });
        }

        /*
         * サイコロ
         */

        if (
          button.customId ===
          'game_dice'
        ) {
          const game = playDice();

          let points = 0;
          let text = '';

          if (game.result === 'win') {
            points = 10;
            text = '🎉 あなたの勝ち！';
          } else if (
            game.result === 'lose'
          ) {
            points = -5;
            text = '😢 あなたの負け…';
          } else {
            text = '🤝 引き分け！';
          }

          const result =
            recordGame(
              interaction.user.id,
              game.result,
              points,
              interaction.user.username
            );

          const embed =
            new EmbedBuilder()
              .setTitle('🎲 サイコロ')
              .setDescription(text)
              .addFields(
                {
                  name: 'あなた',
                  value: `🎲 ${game.player}`,
                  inline: true,
                },
                {
                  name: 'Bot',
                  value: `🎲 ${game.bot}`,
                  inline: true,
                },
                {
                  name: 'ポイント',
                  value:
                    `${points >= 0 ? '+' : ''}${points}pt`,
                  inline: true,
                },
                {
                  name: '所持ポイント',
                  value:
                    `${result.points}pt`,
                }
              )
              .setColor(
                game.result === 'win'
                  ? 0x00ff00
                  : game.result === 'lose'
                    ? 0xff0000
                    : 0xffff00
              );

          return button.update({
            embeds: [embed],
            components: [
              createBackButton(),
            ],
          });
        }

        /*
         * コイントス
         */

        if (
          button.customId ===
          'game_coin'
        ) {
          const result =
            playCoin();

          const embed =
            new EmbedBuilder()
              .setTitle('🪙 コイントス')
              .setDescription(
                `コインの結果は……\n\n# ${result}！`
              )
              .setColor(0xf1c40f);

          return button.update({
            embeds: [embed],
            components: [
              createBackButton(),
            ],
          });
        }

        /*
         * じゃんけん
         */

        if (
          button.customId ===
          'game_rps'
        ) {
          const row =
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    'rps_rock'
                  )
                  .setLabel('グー')
                  .setEmoji('✊')
                  .setStyle(
                    ButtonStyle.Primary
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    'rps_paper'
                  )
                  .setLabel('パー')
                  .setEmoji('✋')
                  .setStyle(
                    ButtonStyle.Primary
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    'rps_scissors'
                  )
                  .setLabel('チョキ')
                  .setEmoji('✌️')
                  .setStyle(
                    ButtonStyle.Primary
                  )
              );

          return button.update({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  '✊ じゃんけん'
                )
                .setDescription(
                  '手を選んでください！'
                )
                .setColor(0x5865f2),
            ],
            components: [row],
          });
        }

        /*
         * じゃんけん結果
         */

        if (
          button.customId.startsWith(
            'rps_'
          )
        ) {
          const choice =
            button.customId.replace(
              'rps_',
              ''
            );

          const game =
            playRps(choice);

          let points = 0;
          let text = '';

          if (
            game.result === 'win'
          ) {
            points = 15;
            text = '🎉 勝ち！';
          } else if (
            game.result === 'lose'
          ) {
            points = -5;
            text = '😢 負け…';
          } else {
            text = '🤝 引き分け！';
          }

          const data =
            recordGame(
              interaction.user.id,
              game.result,
              points,
              interaction.user.username
            );

          const embed =
            new EmbedBuilder()
              .setTitle(
                '✊ じゃんけん結果'
              )
              .setDescription(text)
              .addFields(
                {
                  name: 'あなた',
                  value:
                    game.playerName,
                  inline: true,
                },
                {
                  name: 'Bot',
                  value:
                    game.botName,
                  inline: true,
                },
                {
                  name: 'ポイント',
                  value:
                    `${points >= 0 ? '+' : ''}${points}pt`,
                  inline: true,
                },
                {
                  name: '所持ポイント',
                  value:
                    `${data.points}pt`,
                }
              )
              .setColor(
                game.result === 'win'
                  ? 0x00ff00
                  : game.result === 'lose'
                    ? 0xff0000
                    : 0xffff00
              );

          return button.update({
            embeds: [embed],
            components: [
              createBackButton(),
            ],
          });
        }

        /*
         * HIGH / LOW
         */

        if (
          button.customId ===
            'game_high' ||
          button.customId ===
            'game_low'
        ) {
          const choice =
            button.customId ===
            'game_high'
              ? 'high'
              : 'low';

          const game =
            playHighLow(choice);

          let points = 0;
          let text = '';

          if (
            game.result === 'win'
          ) {
            points = 20;
            text = '🎉 予想的中！';
          } else if (
            game.result === 'lose'
          ) {
            points = -5;
            text = '😢 予想失敗…';
          } else {
            text =
              '🤝 同じ数字でした！';
          }

          const data =
            recordGame(
              interaction.user.id,
              game.result,
              points,
              interaction.user.username
            );

          const choiceText =
            choice === 'high'
              ? '⬆️ HIGH'
              : '⬇️ LOW';

          const embed =
            new EmbedBuilder()
              .setTitle(
                '🎯 HIGH & LOW'
              )
              .setDescription(text)
              .addFields(
                {
                  name: '最初のカード',
                  value:
                    `🃏 ${game.first}`,
                  inline: true,
                },
                {
                  name: 'あなたの予想',
                  value:
                    choiceText,
                  inline: true,
                },
                {
                  name: '次のカード',
                  value:
                    `🃏 ${game.second}`,
                  inline: true,
                },
                {
                  name: 'ポイント',
                  value:
                    `${points >= 0 ? '+' : ''}${points}pt`,
                  inline: true,
                },
                {
                  name: '所持ポイント',
                  value:
                    `${data.points}pt`,
                  inline: true,
                }
              )
              .setColor(
                game.result === 'win'
                  ? 0x00ff00
                  : game.result === 'lose'
                    ? 0xff0000
                    : 0xffff00
              );

          return button.update({
            embeds: [embed],
            components: [
              createBackButton(),
            ],
          });
        }

        /*
         * スロット
         */

        if (
          button.customId ===
          'game_slots'
        ) {
          const game =
            playSlots();

          let text;
          let points;

          if (
            game.outcome ===
            'jackpot'
          ) {
            text =
              '🎉🎉 JACKPOT!! 🎉🎉';
            points = 50;
          } else if (
            game.outcome === 'win'
          ) {
            text =
              '🎉 当たり！';
            points = 15;
          } else {
            text =
              '😢 ハズレ…';
            points = -5;
          }

          const data =
            recordGame(
              interaction.user.id,
              game.outcome ===
                'lose'
                ? 'lose'
                : 'win',
              points,
              interaction.user.username
            );

          const embed =
            new EmbedBuilder()
              .setTitle('🎰 スロット')
              .setDescription(
                `# ${game.result.join(' | ')}\n\n${text}`
              )
              .addFields(
                {
                  name: 'ポイント',
                  value:
                    `${points >= 0 ? '+' : ''}${points}pt`,
                  inline: true,
                },
                {
                  name: '所持ポイント',
                  value:
                    `${data.points}pt`,
                  inline: true,
                }
              )
              .setColor(
                game.outcome ===
                  'jackpot'
                  ? 0xffd700
                  : game.outcome ===
                      'win'
                    ? 0x00ff00
                    : 0xff0000
              );

          return button.update({
            embeds: [embed],
            components: [
              createBackButton(),
            ],
          });
        }

        /*
         * メニューに戻る
         */

        if (
          button.customId ===
          'game_back'
        ) {
          const current =
            getUser(
              interaction.user.id,
              interaction.user.username
            );

          return button.update({
            embeds: [
              menuEmbed.setDescription(
                '遊びたいゲームを選択してください！\n\n' +
                `💰 所持ポイント: **${current.points}pt**`
              ),
            ],
            components: [
              row1,
              row2,
            ],
          });
        }
      }
    );

    collector.on(
      'end',
      async () => {
        const disabledRows =
          [row1, row2].map(row => {
            const components =
              row.components.map(
                component =>
                  ButtonBuilder.from(
                    component
                  ).setDisabled(true)
              );

            return new ActionRowBuilder()
              .addComponents(
                components
              );
          });

        await interaction.editReply({
          components:
            disabledRows,
        }).catch(() => {});
      }
    );
  },
};

function createBackButton() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('game_back')
        .setLabel('ゲーム選択に戻る')
        .setEmoji('🎮')
        .setStyle(
          ButtonStyle.Secondary
        )
    );
}