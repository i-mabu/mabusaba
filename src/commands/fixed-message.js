const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const {
  getFixedMessage,
  createFixedMessage,
  updateFixedMessage,
  deleteFixedMessage,
  getStoredEmbed
} = require('../utils/fixedMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fixed-message')
    .setDescription(
      '固定メッセージを管理します'
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    /*
     * ==========================
     * CREATE
     * ==========================
     */
    .addSubcommand(
      subcommand =>
        subcommand
          .setName('create')
          .setDescription(
            'Embed固定メッセージを作成します'
          )

          .addStringOption(
            option =>
              option
                .setName('title')
                .setDescription(
                  'Embedのタイトル'
                )
                .setRequired(true)
                .setMaxLength(256)
          )

          .addStringOption(
            option =>
              option
                .setName('description')
                .setDescription(
                  '本文。改行対応'
                )
                .setRequired(true)
                .setMaxLength(4096)
          )

          .addStringOption(
            option =>
              option
                .setName('color')
                .setDescription(
                  '色。例: 5865F2'
                )
                .setRequired(false)
                .setMaxLength(6)
          )
    )

    /*
     * ==========================
     * EDIT
     * ==========================
     */
    .addSubcommand(
      subcommand =>
        subcommand
          .setName('edit')
          .setDescription(
            'Embed固定メッセージを編集します'
          )

          .addStringOption(
            option =>
              option
                .setName('title')
                .setDescription(
                  'Embedのタイトル'
                )
                .setRequired(true)
                .setMaxLength(256)
          )

          .addStringOption(
            option =>
              option
                .setName('description')
                .setDescription(
                  '本文。改行対応'
                )
                .setRequired(true)
                .setMaxLength(4096)
          )

          .addStringOption(
            option =>
              option
                .setName('color')
                .setDescription(
                  '色。例: 5865F2'
                )
                .setRequired(false)
                .setMaxLength(6)
          )
    )

    /*
     * ==========================
     * DELETE
     * ==========================
     */
    .addSubcommand(
      subcommand =>
        subcommand
          .setName('delete')
          .setDescription(
            '固定メッセージを削除します'
          )
    )

    /*
     * ==========================
     * SHOW
     * ==========================
     */
    .addSubcommand(
      subcommand =>
        subcommand
          .setName('show')
          .setDescription(
            '固定メッセージを確認します'
          )
    ),

  async execute(
    interaction
  ) {
    /*
     * ==========================
     * 権限チェック
     * ==========================
     */
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      await interaction.reply({
        content:
          '❌ このコマンドは管理者のみ使用できます。',
        ephemeral: true
      });

      return;
    }

    if (
      !interaction.guild
    ) {
      await interaction.reply({
        content:
          '❌ このコマンドはサーバー内でのみ使用できます。',
        ephemeral: true
      });

      return;
    }

    const subcommand =
      interaction.options.getSubcommand();

    if (
      subcommand === 'create'
    ) {
      return createCommand(
        interaction
      );
    }

    if (
      subcommand === 'edit'
    ) {
      return editCommand(
        interaction
      );
    }

    if (
      subcommand === 'delete'
    ) {
      return deleteCommand(
        interaction
      );
    }

    if (
      subcommand === 'show'
    ) {
      return showCommand(
        interaction
      );
    }
  }
};

/*
 * ==================================================
 * Embed生成
 * ==================================================
 */
function createEmbed(
  interaction
) {
  const title =
    interaction.options.getString(
      'title'
    );

  const description =
    interaction.options.getString(
      'description'
    );

  const colorInput =
    interaction.options.getString(
      'color'
    );

  /*
   * デフォルト色
   */
  let color = 0x5865F2;

  if (colorInput) {
    const normalized =
      colorInput
        .replace(
          /^#/,
          ''
        )
        .trim();

    /*
     * 6桁HEXのみ許可
     */
    if (
      !/^[0-9a-fA-F]{6}$/.test(
        normalized
      )
    ) {
      throw new Error(
        '色は6桁のHEX形式で指定してください。例: 5865F2'
      );
    }

    color =
      parseInt(
        normalized,
        16
      );
  }

  return {
    title,
    description,
    color
  };
}

/*
 * ==================================================
 * CREATE
 * ==================================================
 */
async function createCommand(
  interaction
) {
  const guildId =
    interaction.guildId;

  const existing =
    getFixedMessage(
      guildId
    );

  if (existing) {
    await interaction.reply({
      content:
        '❌ このサーバーには既に固定メッセージがあります。\n' +
        '`/fixed-message show` で確認してください。',
      ephemeral: true
    });

    return;
  }

  try {
    const embedData =
      createEmbed(
        interaction
      );

    const embed =
      new EmbedBuilder()
        .setTitle(
          embedData.title
        )
        .setDescription(
          embedData.description
        )
        .setColor(
          embedData.color
        );

    /*
     * 現在のチャンネルへ投稿
     */
    const message =
      await interaction.channel.send({
        embeds: [
          embed
        ]
      });

    createFixedMessage({
      guildId,

      channelId:
        interaction.channel.id,

      messageId:
        message.id,

      content: null,

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            '✅ 固定メッセージを作成しました'
          )
          .addFields(
            {
              name:
                'チャンネル',
              value:
                `<#${interaction.channel.id}>`,
              inline: true
            },
            {
              name:
                'メッセージID',
              value:
                message.id,
              inline: true
            }
          )
          .setColor(
            0x57F287
          )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      '❌ Fixed message create:',
      error
    );

    await interaction.reply({
      content:
        `❌ 作成に失敗しました。\n${error.message}`,
      ephemeral: true
    });
  }
}

/*
 * ==================================================
 * EDIT
 * ==================================================
 */
async function editCommand(
  interaction
) {
  const guildId =
    interaction.guildId;

  const fixed =
    getFixedMessage(
      guildId
    );

  if (!fixed) {
    await interaction.reply({
      content:
        '❌ 固定メッセージが登録されていません。',
      ephemeral: true
    });

    return;
  }

  try {
    const embedData =
      createEmbed(
        interaction
      );

    const embed =
      new EmbedBuilder()
        .setTitle(
          embedData.title
        )
        .setDescription(
          embedData.description
        )
        .setColor(
          embedData.color
        );

    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      throw new Error(
        '固定メッセージのチャンネルが見つかりません。'
      );
    }

    const message =
      await channel.messages.fetch(
        fixed.message_id
      );

    await message.edit({
      content: null,
      embeds: [
        embed
      ]
    });

    updateFixedMessage({
      guildId,

      channelId:
        channel.id,

      messageId:
        message.id,

      content: null,

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            '✅ 固定メッセージを更新しました'
          )
          .addFields({
            name:
              'チャンネル',
            value:
              `<#${channel.id}>`
          })
          .setColor(
            0x57F287
          )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      '❌ Fixed message edit:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージを編集できませんでした。\n' +
        'メッセージが削除されている可能性があります。',
      ephemeral: true
    });
  }
}

/*
 * ==================================================
 * DELETE
 * ==================================================
 */
async function deleteCommand(
  interaction
) {
  const guildId =
    interaction.guildId;

  const fixed =
    getFixedMessage(
      guildId
    );

  if (!fixed) {
    await interaction.reply({
      content:
        '❌ 固定メッセージが登録されていません。',
      ephemeral: true
    });

    return;
  }

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (channel) {
      try {
        const message =
          await channel.messages.fetch(
            fixed.message_id
          );

        await message.delete();
      } catch (error) {
        console.log(
          '固定メッセージは既に削除済みです。'
        );
      }
    }

    deleteFixedMessage(
      guildId
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            '🗑️ 固定メッセージを削除しました'
          )
          .setColor(
            0xED4245
          )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      '❌ Fixed message delete:',
      error
    );

    await interaction.reply({
      content:
        '❌ 削除に失敗しました。',
      ephemeral: true
    });
  }
}

/*
 * ==================================================
 * SHOW
 * ==================================================
 */
async function showCommand(
  interaction
) {
  const guildId =
    interaction.guildId;

  const fixed =
    getFixedMessage(
      guildId
    );

  if (!fixed) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            '📌 固定メッセージ'
          )
          .setDescription(
            '設定されていません。'
          )
          .setColor(
            0x95A5A6
          )
      ],
      ephemeral: true
    });

    return;
  }

  let status =
    '🟢 正常';

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      status =
        '🔴 チャンネルなし';
    } else {
      await channel.messages.fetch(
        fixed.message_id
      );
    }
  } catch {
    status =
      '🟠 メッセージなし';
  }

  const embed =
    getStoredEmbed(
      fixed
    );

  const updated =
    Math.floor(
      fixed.updated_at
    );

  const preview =
    embed?.description ||
    '本文なし';

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          '📌 固定メッセージ情報'
        )
        .addFields(
          {
            name:
              '状態',
            value:
              status
          },
          {
            name:
              'チャンネル',
            value:
              `<#${fixed.channel_id}>`
          },
          {
            name:
              'メッセージID',
            value:
              fixed.message_id
          },
          {
            name:
              'タイトル',
            value:
              embed?.title ||
              'なし'
          },
          {
            name:
              '本文',
            value:
              preview.slice(
                0,
                1024
              )
          },
          {
            name:
              '最終更新',
            value:
              `<t:${updated}:F>`
          }
        )
        .setColor(
          0x5865F2
        )
    ],
    ephemeral: true
  });
}