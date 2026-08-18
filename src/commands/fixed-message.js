const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require('discord.js');

const {
  getFixedMessage,
  createFixedMessage,
  updateFixedMessage,
  deleteFixedMessage,
  getStoredEmbed
} = require('../utils/fixedMessage');

/*
 * ==================================================
 * コマンド本体
 *
 * 必ず data を持たせる
 * ==================================================
 */
const command = {
  data: new SlashCommandBuilder()
    .setName('fixed-message')
    .setDescription('固定メッセージを管理します')

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    /*
     * CREATE
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription(
          '固定メッセージを作成します'
        )
    )

    /*
     * EDIT
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription(
          '固定メッセージを編集します'
        )
    )

    /*
     * DELETE
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription(
          '固定メッセージを削除します'
        )
    )

    /*
     * SHOW
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          '固定メッセージを確認します'
        )
    ),

  /*
   * ==================================================
   * Slash Command
   * ==================================================
   */
  async execute(interaction) {
    /*
     * 管理者確認
     */
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      await interaction.reply({
        content:
          '❌ このコマンドは管理者のみ使用できます。',
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    /*
     * サーバー限定
     */
    if (!interaction.guild) {
      await interaction.reply({
        content:
          '❌ このコマンドはサーバー内でのみ使用できます。',
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const subcommand =
      interaction.options.getSubcommand();

    /*
     * CREATE
     */
    if (
      subcommand === 'create'
    ) {
      await showCreateModal(
        interaction
      );

      return;
    }

    /*
     * EDIT
     */
    if (
      subcommand === 'edit'
    ) {
      await showEditModal(
        interaction
      );

      return;
    }

    /*
     * DELETE
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
     * SHOW
     */
    if (
      subcommand === 'show'
    ) {
      await showCommand(
        interaction
      );

      return;
    }
  },

  /*
   * ==================================================
   * Modal
   * ==================================================
   */
  async handleModal(interaction) {
    if (
      !interaction.isModalSubmit()
    ) {
      return false;
    }

    if (
      interaction.customId ===
      'fixed-message-create'
    ) {
      await handleCreateModal(
        interaction
      );

      return true;
    }

    if (
      interaction.customId ===
      'fixed-message-edit'
    ) {
      await handleEditModal(
        interaction
      );

      return true;
    }

    return false;
  }
};

/*
 * ==================================================
 * CREATE Modal表示
 * ==================================================
 */
async function showCreateModal(
  interaction
) {
  const existing =
    getFixedMessage(
      interaction.guildId
    );

  if (existing) {
    await interaction.reply({
      content:
        '❌ このサーバーには既に固定メッセージがあります。\n' +
        '`/fixed-message edit` で編集してください。',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        'fixed-message-create'
      )
      .setTitle(
        '📌 固定メッセージを作成'
      );

  /*
   * タイトル
   */
  const titleInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-title'
      )
      .setLabel(
        'タイトル'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setPlaceholder(
        '📢 まぶ鯖へようこそ！'
      )
      .setMaxLength(256)
      .setRequired(true);

  /*
   * 本文
   *
   * Paragraph
   * ↓
   * Enterで改行可能
   */
  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-description'
      )
      .setLabel(
        '本文'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setPlaceholder(
        'ここに本文を入力してください。\n\nEnterで改行できます。'
      )
      .setMaxLength(4000)
      .setRequired(true);

  /*
   * 色
   */
  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-color'
      )
      .setLabel(
        '色（HEX）'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setPlaceholder(
        '5865F2'
      )
      .setValue(
        '5865F2'
      )
      .setMaxLength(6)
      .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(
        titleInput
      ),

    new ActionRowBuilder()
      .addComponents(
        descriptionInput
      ),

    new ActionRowBuilder()
      .addComponents(
        colorInput
      )
  );

  await interaction.showModal(
    modal
  );
}

/*
 * ==================================================
 * EDIT Modal表示
 * ==================================================
 */
async function showEditModal(
  interaction
) {
  const fixed =
    getFixedMessage(
      interaction.guildId
    );

  if (!fixed) {
    await interaction.reply({
      content:
        '❌ 固定メッセージが登録されていません。\n' +
        '`/fixed-message create` で作成してください。',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const storedEmbed =
    getStoredEmbed(
      fixed
    );

  const title =
    storedEmbed?.title ||
    fixed.embed_title ||
    '';

  const description =
    storedEmbed?.description ||
    fixed.embed_description ||
    '';

  let color =
    storedEmbed?.color ??
    fixed.embed_color ??
    0x5865F2;

  if (
    typeof color === 'number'
  ) {
    color =
      color
        .toString(16)
        .padStart(
          6,
          '0'
        )
        .toUpperCase();
  }

  color =
    String(color)
      .replace(
        /^#/,
        ''
      );

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      color
    )
  ) {
    color =
      '5865F2';
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        'fixed-message-edit'
      )
      .setTitle(
        '📌 固定メッセージを編集'
      );

  /*
   * タイトル
   */
  const titleInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-title'
      )
      .setLabel(
        'タイトル'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setMaxLength(256)
      .setValue(
        title.slice(
          0,
          256
        )
      )
      .setRequired(true);

  /*
   * 本文
   */
  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-description'
      )
      .setLabel(
        '本文'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setMaxLength(4000)
      .setValue(
        description.slice(
          0,
          4000
        )
      )
      .setRequired(true);

  /*
   * 色
   */
  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'fixed-color'
      )
      .setLabel(
        '色（HEX）'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setMaxLength(6)
      .setValue(
        color
      )
      .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(
        titleInput
      ),

    new ActionRowBuilder()
      .addComponents(
        descriptionInput
      ),

    new ActionRowBuilder()
      .addComponents(
        colorInput
      )
  );

  await interaction.showModal(
    modal
  );
}

/*
 * ==================================================
 * HEX → Number
 * ==================================================
 */
function parseColor(
  value
) {
  const color =
    String(value || '')
      .replace(
        /^#/,
        ''
      )
      .trim();

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      color
    )
  ) {
    return null;
  }

  return parseInt(
    color,
    16
  );
}

/*
 * ==================================================
 * CREATE
 * ==================================================
 */
async function handleCreateModal(
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
        '❌ このサーバーには既に固定メッセージがあります。',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const title =
    interaction.fields.getTextInputValue(
      'fixed-title'
    );

  const description =
    interaction.fields.getTextInputValue(
      'fixed-description'
    );

  const colorInput =
    interaction.fields.getTextInputValue(
      'fixed-color'
    );

  const color =
    parseColor(
      colorInput
    );

  if (color === null) {
    await interaction.reply({
      content:
        '❌ 色は6桁のHEX形式で入力してください。\n' +
        '例：`5865F2`',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const embedData = {
    title,
    description,
    color
  };

  const embed =
    new EmbedBuilder()
      .setTitle(
        title
      )
      .setDescription(
        description
      )
      .setColor(
        color
      );

  try {
    /*
     * 現在のチャンネルに投稿
     */
    const message =
      await interaction.channel.send({
        embeds: [
          embed
        ]
      });

    /*
     * SQLite
     */
    createFixedMessage({
      guildId,

      channelId:
        interaction.channel.id,

      messageId:
        message.id,

      content:
        null,

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    await interaction.reply({
      content:
        '✅ 固定メッセージを作成しました。',
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      'Fixed message create error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの作成に失敗しました。',
      flags: MessageFlags.Ephemeral
    });
  }
}

/*
 * ==================================================
 * EDIT
 *
 * 重要：
 * Discordには既存メッセージを
 * 「一番下へ移動」するAPIがないため、
 *
 * 旧メッセージ削除
 * ↓
 * 新メッセージ作成
 * ↓
 * SQLiteのmessage_id更新
 *
 * とする。
 * ==================================================
 */
async function handleEditModal(
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
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const title =
    interaction.fields.getTextInputValue(
      'fixed-title'
    );

  const description =
    interaction.fields.getTextInputValue(
      'fixed-description'
    );

  const colorInput =
    interaction.fields.getTextInputValue(
      'fixed-color'
    );

  const color =
    parseColor(
      colorInput
    );

  if (color === null) {
    await interaction.reply({
      content:
        '❌ 色は6桁のHEX形式で入力してください。\n' +
        '例：`5865F2`',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const embedData = {
    title,
    description,
    color
  };

  const embed =
    new EmbedBuilder()
      .setTitle(
        title
      )
      .setDescription(
        description
      )
      .setColor(
        color
      );

  try {
    /*
     * チャンネル
     */
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      throw new Error(
        '固定メッセージのチャンネルがありません。'
      );
    }

    /*
     * ========================================
     * 旧メッセージ削除
     * ========================================
     */
    try {
      const oldMessage =
        await channel.messages.fetch(
          fixed.message_id
        );

      await oldMessage.delete();

    } catch (error) {
      /*
       * 既に削除済みなら続行
       */
      console.log(
        '旧固定メッセージは存在しません。'
      );
    }

    /*
     * ========================================
     * 新メッセージ作成
     *
     * → チャンネル最下部
     * ========================================
     */
    const newMessage =
      await channel.send({
        embeds: [
          embed
        ]
      });

    /*
     * ========================================
     * SQLite更新
     * ========================================
     */
    updateFixedMessage({
      guildId,

      channelId:
        channel.id,

      messageId:
        newMessage.id,

      content:
        null,

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    await interaction.reply({
      content:
        '✅ 固定メッセージを更新しました。\n' +
        '📌 チャンネルの最下部へ再配置しました。',
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      'Fixed message edit error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージを更新できませんでした。',
      flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    /*
     * Discord側のメッセージ削除
     */
    if (channel) {
      try {
        const message =
          await channel.messages.fetch(
            fixed.message_id
          );

        await message.delete();

      } catch {
        console.log(
          '固定メッセージは既に削除されています。'
        );
      }
    }

    /*
     * SQLite
     */
    deleteFixedMessage(
      guildId
    );

    await interaction.reply({
      content:
        '🗑️ 固定メッセージを削除しました。',
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      'Fixed message delete error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの削除に失敗しました。',
      flags: MessageFlags.Ephemeral
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
  const fixed =
    getFixedMessage(
      interaction.guildId
    );

  if (!fixed) {
    await interaction.reply({
      content:
        '📌 固定メッセージは設定されていません。',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const storedEmbed =
    getStoredEmbed(
      fixed
    );

  let status =
    '🟢 正常';

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      status =
        '🔴 チャンネルがありません';
    } else {
      await channel.messages.fetch(
        fixed.message_id
      );
    }

  } catch {
    status =
      '🟠 メッセージがありません';
  }

  const updated =
    Math.floor(
      Number(
        fixed.updated_at
      )
    );

  const description =
    storedEmbed?.description ||
    fixed.embed_description ||
    'なし';

  const infoEmbed =
    new EmbedBuilder()
      .setTitle(
        '📌 固定メッセージ情報'
      )
      .addFields(
        {
          name: '状態',
          value: status,
          inline: true
        },
        {
          name: 'チャンネル',
          value:
            `<#${fixed.channel_id}>`,
          inline: true
        },
        {
          name: 'メッセージID',
          value:
            fixed.message_id
        },
        {
          name: 'タイトル',
          value:
            storedEmbed?.title ||
            fixed.embed_title ||
            'なし'
        },
        {
          name: '本文',
          value:
            description.slice(
              0,
              1024
            )
        },
        {
          name: '最終更新',
          value:
            `<t:${updated}:F>`
        }
      )
      .setColor(
        0x5865F2
      );

  await interaction.reply({
    embeds: [
      infoEmbed
    ],
    flags: MessageFlags.Ephemeral
  });
}

/*
 * ==================================================
 * ここが重要
 *
 * module.exports.data が確実に存在する
 * ==================================================
 */
module.exports = command;