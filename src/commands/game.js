const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  getUser,
  recordGame
} = require('../utils/gameData');

const {
  getGamePoints
} = require('../utils/gamePoints');

const {
  playDice
} = require('../games/dice');

const {
  playCoin
} = require('../games/coin');

const {
  playRps
} = require('../games/rps');

const {
  playHighLow
} = require('../games/highlow');

const {
  playSlots
} = require('../games/slots');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription(
      'まぶ鯖ミニゲーム'
    ),

  async execute(interaction) {
    const user =
      getUser(
        interaction.user.id,
        interaction.user.username
      );

    await interaction.reply({
      embeds: [
        createMenuEmbed(
          user.points
        )
      ],
      components:
        createMenuRows()
    });

    const message =
      await interaction.fetchReply();

    const collector =
      message.createMessageComponentCollector({
        time: 120000,

        filter: button => {
          return (
            button.user.id ===
            interaction.user.id
          );
        }
      });

    collector.on(
      'collect',
      async button => {
        try {
          /*
           * 他人による操作
           */
          if (
            button.user.id !==
            interaction.user.id
          ) {
            await button.reply({
              content:
                '❌ このゲームを開始したユーザー以外は操作できません。',
              ephemeral: true
            });

            return;
          }

          /*
           * ========================
           * ゲーム選択に戻る
           * ========================
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

            await button.update({
              embeds: [
                createMenuEmbed(
                  current.points
                )
              ],
              components:
                createMenuRows()
            });

            return;
          }

          /*
           * ========================
           * サイコロ
           * ========================
           */
          if (
            button.customId ===
            'game_dice'
          ) {
            const game =
              playDice();

            const points =
              getGamePoints(
                'dice',
                game.result
              );

            const data =
              recordGame({
                userId:
                  interaction.user.id,

                username:
                  interaction.user.username,

                game:
                  'dice',

                result:
                  game.result,

                points,

                metadata: {
                  player:
                    game.player,

                  bot:
                    game.bot
                }
              });

            let text;

            if (
              game.result ===
              'win'
            ) {
              text =
                '🎉 あなたの勝ち！';
            } else if (
              game.result ===
              'lose'
            ) {
              text =
                '😢 あなたの負け…';
            } else {
              text =
                '🤝 引き分け！';
            }

            const embed =
              new EmbedBuilder()
                .setTitle(
                  '🎲 サイコロ'
                )
                .setDescription(
                  text
                )
                .addFields(
                  {
                    name:
                      'あなた',
                    value:
                      `🎲 ${game.player}`,
                    inline: true
                  },
                  {
                    name:
                      'Bot',
                    value:
                      `🎲 ${game.bot}`,
                    inline: true
                  },
                  {
                    name:
                      'ポイント変動',
                    value:
                      formatPoints(
                        points
                      ),
                    inline: true
                  },
                  {
                    name:
                      '所持ポイント',
                    value:
                      `${data.points}pt`
                  }
                )
                .setColor(
                  getResultColor(
                    game.result
                  )
                );

            await button.update({
              embeds: [embed],
              components: [
                createBackButton()
              ]
            });

            return;
          }

          /*
           * ========================
           * コイントス
           * ========================
           *
           * コイントスは
           * 「結果を出すだけ」のゲームなので
           * 今回は引き分け扱い。
           *
           * 勝敗を選択する方式に変更する場合は
           * ここを変更可能。
           */
          if (
            button.customId ===
            'game_coin'
          ) {
            const result =
              playCoin();

            const points =
              getGamePoints(
                'coin',
                'draw'
              );

            const data =
              recordGame({
                userId:
                  interaction.user.id,

                username:
                  interaction.user.username,

                game:
                  'coin',

                result:
                  'draw',

                points,

                metadata: {
                  result
                }
              });

            const embed =
              new EmbedBuilder()
                .setTitle(
                  '🪙 コイントス'
                )
                .setDescription(
                  `コインの結果は……\n\n# ${result}！`
                )
                .addFields({
                  name:
                    'ポイント変動',
                  value:
                    formatPoints(
                      points
                    ),
                  inline: true
                }, {
                  name:
                    '所持ポイント',
                  value:
                    `${data.points}pt`,
                  inline: true
                })
                .setColor(
                  0xf1c40f
                );

            await button.update({
              embeds: [embed],
              components: [
                createBackButton()
              ]
            });

            return;
          }

          /*
           * ========================
           * じゃんけん
           * ========================
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
                    .setLabel(
                      'グー'
                    )
                    .setEmoji(
                      '✊'
                    )
                    .setStyle(
                      ButtonStyle.Primary
                    ),

                  new ButtonBuilder()
                    .setCustomId(
                      'rps_paper'
                    )
                    .setLabel(
                      'パー'
                    )
                    .setEmoji(
                      '✋'
                    )
                    .setStyle(
                      ButtonStyle.Primary
                    ),

                  new ButtonBuilder()
                    .setCustomId(
                      'rps_scissors'
                    )
                    .setLabel(
                      'チョキ'
                    )
                    .setEmoji(
                      '✌️'
                    )
                    .setStyle(
                      ButtonStyle.Primary
                    )
                );

            await button.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    '✊ じゃんけん'
                  )
                  .setDescription(
                    '手を選んでください！'
                  )
                  .setColor(
                    0x5865f2
                  )
              ],
              components: [row]
            });

            return;
          }

          /*
           * ========================
           * じゃんけん結果
           * ========================
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
              playRps(
                choice
              );

            const points =
              getGamePoints(
                'rps',
                game.result
              );

            const data =
              recordGame({
                userId:
                  interaction.user.id,

                username:
                  interaction.user.username,

                game:
                  'rps',

                result:
                  game.result,

                points,

                metadata: {
                  player:
                    game.player,

                  bot:
                    game.bot,

                  playerName:
                    game.playerName,

                  botName:
                    game.botName
                }
              });

            let text;

            if (
              game.result ===
              'win'
            ) {
              text =
                '🎉 勝ち！';
            } else if (
              game.result ===
              'lose'
            ) {
              text =
                '😢 負け…';
            } else {
              text =
                '🤝 引き分け！';
            }

            const embed =
              new EmbedBuilder()
                .setTitle(
                  '✊ じゃんけん結果'
                )
                .setDescription(
                  text
                )
                .addFields(
                  {
                    name:
                      'あなた',
                    value:
                      game.playerName,
                    inline: true
                  },
                  {
                    name:
                      'Bot',
                    value:
                      game.botName,
                    inline: true
                  },
                  {
                    name:
                      'ポイント変動',
                    value:
                      formatPoints(
                        points
                      ),
                    inline: true
                  },
                  {
                    name:
                      '所持ポイント',
                    value:
                      `${data.points}pt`
                  }
                )
                .setColor(
                  getResultColor(
                    game.result
                  )
                );

            await button.update({
              embeds: [embed],
              components: [
                createBackButton()
              ]
            });

            return;
          }

          /*
           * ========================
           * HIGH
           * ========================
           */
          if (
            button.customId ===
            'game_high'
          ) {
            await playHighLowGame(
              button,
              'high',
              interaction
            );

            return;
          }

          /*
           * ========================
           * LOW
           * ========================
           */
          if (
            button.customId ===
            'game_low'
          ) {
            await playHighLowGame(
              button,
              'low',
              interaction
            );

            return;
          }

          /*
           * ========================
           * スロット
           * ========================
           */
          if (
            button.customId ===
            'game_slots'
          ) {
            const game =
              playSlots();

            let result;
            let text;

            if (
              game.outcome ===
              'jackpot'
            ) {
              result =
                'jackpot';

              text =
                '🎉🎉 JACKPOT!! 🎉🎉';
            } else if (
              game.outcome ===
              'win'
            ) {
              result =
                'win';

              text =
                '🎉 当たり！';
            } else {
              result =
                'lose';

              text =
                '😢 ハズレ…';
            }

            const points =
              getGamePoints(
                'slots',
                result
              );

            const data =
              recordGame({
                userId:
                  interaction.user.id,

                username:
                  interaction.user.username,

                game:
                  'slots',

                result,

                points,

                metadata: {
                  slots:
                    game.result,

                  outcome:
                    game.outcome
                }
              });

            const embed =
              new EmbedBuilder()
                .setTitle(
                  '🎰 スロット'
                )
                .setDescription(
                  `# ${game.result.join(' | ')}\n\n${text}`
                )
                .addFields(
                  {
                    name:
                      'ポイント変動',
                    value:
                      formatPoints(
                        points
                      ),
                    inline: true
                  },
                  {
                    name:
                      '所持ポイント',
                    value:
                      `${data.points}pt`,
                    inline: true
                  }
                )
                .setColor(
                  result ===
                    'jackpot'
                    ? 0xffd700
                    : result ===
                        'win'
                      ? 0x00ff00
                      : 0xff0000
                );

            await button.update({
              embeds: [embed],
              components: [
                createBackButton()
              ]
            });

            return;
          }
        } catch (error) {
          console.error(
            '❌ Game Button Error:',
            error
          );

          if (
            !button.replied &&
            !button.deferred
          ) {
            await button.reply({
              content:
                '❌ ゲーム処理中にエラーが発生しました。',
              ephemeral: true
            }).catch(
              () => {}
            );
          }
        }
      }
    );

    /*
     * Collector終了時には
     * メッセージを変更しない。
     */
    collector.on(
      'end',
      () => {
        console.log(
          `🎮 Game collector終了: ${interaction.user.tag}`
        );
      }
    );
  }
};

/*
 * ==========================
 * HIGH / LOW
 * ==========================
 */
async function playHighLowGame(
  button,
  choice,
  interaction
) {
  const game =
    playHighLow(
      choice
    );

  const points =
    getGamePoints(
      'highlow',
      game.result
    );

  const data =
    recordGame({
      userId:
        interaction.user.id,

      username:
        interaction.user.username,

      game:
        'highlow',

      result:
        game.result,

      points,

      metadata: {
        choice,

        first:
          game.first,

        second:
          game.second
      }
    });

  let text;

  if (
    game.result ===
    'win'
  ) {
    text =
      '🎉 予想的中！';
  } else if (
    game.result ===
    'lose'
  ) {
    text =
      '😢 予想失敗…';
  } else {
    text =
      '🤝 同じ数字でした！';
  }

  const embed =
    new EmbedBuilder()
      .setTitle(
        '🎯 HIGH & LOW'
      )
      .setDescription(
        text
      )
      .addFields(
        {
          name:
            '最初のカード',
          value:
            `🃏 ${game.first}`,
          inline: true
        },
        {
          name:
            'あなたの予想',
          value:
            choice === 'high'
              ? '⬆️ HIGH'
              : '⬇️ LOW',
          inline: true
        },
        {
          name:
            '次のカード',
          value:
            `🃏 ${game.second}`,
          inline: true
        },
        {
          name:
            'ポイント変動',
          value:
            formatPoints(
              points
            ),
          inline: true
        },
        {
          name:
            '所持ポイント',
          value:
            `${data.points}pt`,
          inline: true
        }
      )
      .setColor(
        getResultColor(
          game.result
        )
      );

  await button.update({
    embeds: [embed],
    components: [
      createBackButton()
    ]
  });
}

/*
 * ==========================
 * メニューEmbed
 * ==========================
 */
function createMenuEmbed(
  points
) {
  return new EmbedBuilder()
    .setTitle(
      '🎮 まぶ鯖ミニゲーム'
    )
    .setDescription(
      '遊びたいゲームを選択してください！\n\n' +
      `💰 所持ポイント: **${points}pt**`
    )
    .addFields({
      name:
        '🎲 ゲーム一覧',
      value:
        '🎲 サイコロ　+10 / -5\n' +
        '🪙 コイントス　0pt\n' +
        '✊ じゃんけん　+15 / -5\n' +
        '🎯 HIGH & LOW　+20 / -5\n' +
        '🎰 スロット　+15 / -5\n' +
        '🎰 JACKPOT　+50'
    })
    .setColor(
      0x5865f2
    );
}

/*
 * ==========================
 * メニューボタン
 * ==========================
 */
function createMenuRows() {
  const row1 =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            'game_dice'
          )
          .setLabel(
            'サイコロ'
          )
          .setEmoji(
            '🎲'
          )
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId(
            'game_coin'
          )
          .setLabel(
            'コイン'
          )
          .setEmoji(
            '🪙'
          )
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId(
            'game_rps'
          )
          .setLabel(
            'じゃんけん'
          )
          .setEmoji(
            '✊'
          )
          .setStyle(
            ButtonStyle.Success
          )
      );

  const row2 =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            'game_high'
          )
          .setLabel(
            'HIGH'
          )
          .setEmoji(
            '⬆️'
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            'game_low'
          )
          .setLabel(
            'LOW'
          )
          .setEmoji(
            '⬇️'
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            'game_slots'
          )
          .setLabel(
            'スロット'
          )
          .setEmoji(
            '🎰'
          )
          .setStyle(
            ButtonStyle.Danger
          )
      );

  return [
    row1,
    row2
  ];
}

/*
 * ==========================
 * 戻るボタン
 * ==========================
 */
function createBackButton() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          'game_back'
        )
        .setLabel(
          'ゲーム選択に戻る'
        )
        .setEmoji(
          '🎮'
        )
        .setStyle(
          ButtonStyle.Secondary
        )
    );
}

/*
 * ==========================
 * ポイント表示
 * ==========================
 */
function formatPoints(
  points
) {
  if (points > 0) {
    return `📈 +${points}pt`;
  }

  if (points < 0) {
    return `📉 ${points}pt`;
  }

  return '➖ 0pt';
}

/*
 * ==========================
 * 結果色
 * ==========================
 */
function getResultColor(
  result
) {
  if (
    result === 'win' ||
    result === 'jackpot'
  ) {
    return 0x00ff00;
  }

  if (
    result === 'lose'
  ) {
    return 0xff0000;
  }

  return 0xffff00;
}