const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
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
    .setDescription('固定メッセージを管理します')

    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    /*
     * ==========================
     * CREATE
     * ==========================
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription(
          '固定メッセージを作成します'
        )
    )

    /*
     * ==========================
     * EDIT
     * ==========================
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription(
          '固定メッセージを編集します'
        )
    )

    /*
     * ==========================
     * DELETE
     * ==========================
     */
    .addSubcommand(subcommand =>
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
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          '固定メッセージを確認します'
        )
    ),

  async execute(interaction) {
    /*
     * ==========================
     * 権限確認
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

    if (!interaction.guild) {
      await interaction.reply({
        content:
          '❌ サーバー内でのみ使用できます。',
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
    if (subcommand === 'create') {
      return showCreateModal(interaction);
    }

    /*
     * ==========================
     * EDIT
     * ==========================
     */
    if (subcommand === 'edit') {
      return showEditModal(interaction);
    }

    /*
     * ==========================
     * DELETE
     * ==========================
     */
    if (subcommand === 'delete') {
      return deleteFixedMessageCommand(
        interaction
      );
    }

    /*
     * ==========================
     * SHOW
     * ==========================
     */
    if (subcommand === 'show') {
      return showFixedMessageCommand(
        interaction
      );
    }
  },

  /*
   * index.jsから呼び出す
   * Modal / Buttonなどの処理
   */
  async handleModal(interaction) {
    if (!interaction.isModalSubmit()) {
      return false;
    }

    /*
     * CREATE
     */
    if (
      interaction.customId ===
      'fixed-message-create'
    ) {
      await handleCreateModal(
        interaction
      );

      return true;
    }

    /*
     * EDIT
     */
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
 * CREATE MODAL
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
        '`/fixed-message edit` で編集できます。',
      ephemeral: true
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
        '例：📢 まぶ鯖へようこそ！'
      )
      .setMaxLength(256)
      .setRequired(true);

  /*
   * 本文
   *
   * Paragraphなので
   * Enterによる複数行入力が可能
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
      .setMaxLength(4096)
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
 * EDIT MODAL
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
      ephemeral: true
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

  /*
   * 数値の場合HEXに変換
   */
  if (
    typeof color === 'number'
  ) {
    color =
      color
        .toString(16)
        .padStart(6, '0')
        .toUpperCase();
  }

  /*
   * #が付いている場合除去
   */
  color =
    String(color)
      .replace(
        /^#/,
        ''
      );

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
        title.slice(0, 256)
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
      .setMaxLength(4096)
      .setValue(
        description.slice(0, 4096)
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
        color.slice(0, 6)
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
 * CREATE処理
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
      ephemeral: true
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

  let colorInput =
    interaction.fields.getTextInputValue(
      'fixed-color'
    );

  colorInput =
    colorInput
      .replace(
        /^#/,
        ''
      )
      .trim();

  /*
   * HEXチェック
   */
  if (
    !/^[0-9a-fA-F]{6}$/.test(
      colorInput
    )
  ) {
    await interaction.reply({
      content:
        '❌ 色は6桁のHEX形式で入力してください。\n' +
        '例：`5865F2`',
      ephemeral: true
    });

    return;
  }

  const color =
    parseInt(
      colorInput,
      16
    );

  try {
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

    /*
     * 現在のチャンネルに送信
     */
    const message =
      await interaction.channel.send({
        embeds: [
          embed
        ]
      });

    /*
     * SQLite保存
     */
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
      content:
        '✅ 固定メッセージを作成しました。',
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
 * ==================================================
 * EDIT処理
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
      ephemeral: true
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

  let colorInput =
    interaction.fields.getTextInputValue(
      'fixed-color'
    );

  colorInput =
    colorInput
      .replace(
        /^#/,
        ''
      )
      .trim();

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      colorInput
    )
  ) {
    await interaction.reply({
      content:
        '❌ 色は6桁のHEX形式で入力してください。\n' +
        '例：`5865F2`',
      ephemeral: true
    });

    return;
  }

  const color =
    parseInt(
      colorInput,
      16
    );

  try {
    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      throw new Error(
        'チャンネルが見つかりません。'
      );
    }

    const message =
      await channel.messages.fetch(
        fixed.message_id
      );

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

    /*
     * Discord上の既存メッセージを編集
     */
    await message.edit({
      content: null,
      embeds: [
        embed
      ]
    });

    /*
     * SQLite更新
     */
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
      content:
        '✅ 固定メッセージを更新しました。',
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
        'メッセージが削除されていないか確認してください。',
      ephemeral: true
    });
  }
}

/*
 * ==================================================
 * DELETE
 * ==================================================
 */
async function deleteFixedMessageCommand(
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
      } catch {
        console.log(
          '固定メッセージは既に削除されています。'
        );
      }
    }

    deleteFixedMessage(
      guildId
    );

    await interaction.reply({
      content:
        '🗑️ 固定メッセージを削除しました。',
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
 * ==================================================
 * SHOW
 * ==================================================
 */
async function showFixedMessageCommand(
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
      ephemeral: true
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

  const updated =
    Math.floor(
      fixed.updated_at
    );

  const infoEmbed =
    new EmbedBuilder()
      .setTitle(
        '📌 固定メッセージ情報'
      )
      .addFields(
        {
          name: '状態',
          value: status
        },
        {
          name: 'チャンネル',
          value:
            `<#${fixed.channel_id}>`
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
            (
              storedEmbed?.description ||
              fixed.embed_description ||
              'なし'
            ).slice(0, 1024)
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
    ephemeral: true
  });
}