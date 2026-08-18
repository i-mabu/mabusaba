const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const {
  getFixedMessage,
  createFixedMessage,
  updateFixedMessage,
  deleteFixedMessage
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

    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription(
          '現在のチャンネルに固定メッセージを作成します'
        )
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription(
              '固定するメッセージ'
            )
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription(
          '固定メッセージを編集します'
        )
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription(
              '新しいメッセージ'
            )
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription(
          '固定メッセージを削除します'
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          '固定メッセージの状態を確認します'
        )
    ),

  async execute(interaction) {
    /*
     * 念のため実行時にも管理者確認
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

    const subcommand =
      interaction.options.getSubcommand();

    /*
     * ==========================
     * CREATE
     * ==========================
     */
    if (
      subcommand === 'create'
    ) {
      await createCommand(
        interaction
      );

      return;
    }

    /*
     * ==========================
     * EDIT
     * ==========================
     */
    if (
      subcommand === 'edit'
    ) {
      await editCommand(
        interaction
      );

      return;
    }

    /*
     * ==========================
     * DELETE
     * ==========================
     */
    if (
      subcommand === 'delete'
    ) {
      await deleteCommand(
        interaction
      );

      return;
    }

    /*
     * ==========================
     * SHOW
     * ==========================
     */
    if (
      subcommand === 'show'
    ) {
      await showCommand(
        interaction
      );
    }
  }
};

/*
 * ==========================
 * CREATE
 * ==========================
 */
async function createCommand(
  interaction
) {
  const content =
    interaction.options.getString(
      'message'
    );

  const guildId =
    interaction.guildId;

  const channel =
    interaction.channel;

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
    const message =
      await channel.send({
        content
      });

    createFixedMessage({
      guildId,
      channelId:
        channel.id,
      messageId:
        message.id,
      content,
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
                `<#${channel.id}>`,
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
            0x57f287
          ),
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      'Fixed message create error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの作成に失敗しました。',
      ephemeral: true
    });
  }
}

/*
 * ==========================
 * EDIT
 * ==========================
 */
async function editCommand(
  interaction
) {
  const content =
    interaction.options.getString(
      'message'
    );

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

    if (!channel) {
      await interaction.reply({
        content:
          '❌ 固定メッセージのチャンネルが見つかりません。',
        ephemeral: true
      });

      return;
    }

    const message =
      await channel.messages.fetch(
        fixed.message_id
      );

    await message.edit({
      content
    });

    updateFixedMessage({
      guildId,

      channelId:
        channel.id,

      messageId:
        message.id,

      content,

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
            0x57f287
          )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      'Fixed message edit error:',
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
 * ==========================
 * DELETE
 * ==========================
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
        /*
         * Discord側ですでに削除済みでも
         * DBからは削除する。
         */
        console.log(
          '固定メッセージは既に削除されている可能性があります。'
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
            0xed4245
          )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(
      'Fixed message delete error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの削除に失敗しました。',
      ephemeral: true
    });
  }
}

/*
 * ==========================
 * SHOW
 * ==========================
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
            '現在、固定メッセージは設定されていません。'
          )
          .setColor(
            0x95a5a6
          )
      ],
      ephemeral: true
    });

    return;
  }

  let status =
    '🟢 登録済み';

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      status =
        '🔴 チャンネルが存在しません';
    } else {
      await channel.messages.fetch(
        fixed.message_id
      );
    }
  } catch {
    status =
      '🟠 メッセージが存在しません';
  }

  const timestamp =
    Math.floor(
      fixed.updated_at
    );

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
              '内容',
            value:
              fixed.content.slice(
                0,
                1024
              )
          },
          {
            name:
              '最終更新',
            value:
              `<t:${timestamp}:F>`
          }
        )
        .setColor(
          0x5865f2
        )
    ],
    ephemeral: true
  });
}