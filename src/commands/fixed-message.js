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
 * =========================================================
 * Command
 * =========================================================
 */

const command = {
  data: new SlashCommandBuilder()
    .setName('fixed-message')
    .setDescription(
      '固定メッセージを管理します'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    /*
     * Create
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription(
          '固定メッセージを作成します'
        )
    )

    /*
     * Edit
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription(
          '固定メッセージを編集します'
        )
    )

    /*
     * Delete
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription(
          '固定メッセージを削除します'
        )
    )

    /*
     * Show
     */
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          '固定メッセージを確認します'
        )
    ),

  /*
   * =======================================================
   * Execute
   * =======================================================
   */

  async execute(interaction) {
    /*
     * Server only
     */
    if (!interaction.guild) {
      await interaction.reply({
        content:
          '❌ このコマンドはサーバー内でのみ使用できます。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    /*
     * Administrator
     */
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      await interaction.reply({
        content:
          '❌ このコマンドは管理者のみ使用できます。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    const subcommand =
      interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await showCreateModal(
          interaction
        );
        break;

      case 'edit':
        await showEditModal(
          interaction
        );
        break;

      case 'delete':
        await deleteCommand(
          interaction
        );
        break;

      case 'show':
        await showCommand(
          interaction
        );
        break;

      default:
        await interaction.reply({
          content:
            '❌ 不明なサブコマンドです。',
          flags:
            MessageFlags.Ephemeral
        });
    }
  },

  /*
   * =======================================================
   * Modal handler
   * =======================================================
   */

  async handleModal(interaction) {
    if (
      !interaction.isModalSubmit()
    ) {
      return false;
    }

    switch (
      interaction.customId
    ) {
      case 'fixed-message-create':
        await handleCreateModal(
          interaction
        );
        return true;

      case 'fixed-message-edit':
        await handleEditModal(
          interaction
        );
        return true;

      default:
        return false;
    }
  }
};

/*
 * =========================================================
 * Create Modal
 * =========================================================
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
        '❌ 既に固定メッセージが存在します。\n' +
        '`/fixed-message edit` で編集してください。',
      flags:
        MessageFlags.Ephemeral
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
   * Title
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
   * Description
   *
   * Paragraphなので改行可能
   *
   * Discord Embed description:
   * 最大4000文字
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
   * Color
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
 * =========================================================
 * Edit Modal
 * =========================================================
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
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  const storedEmbed =
    getStoredEmbed(
      fixed
    );

  const title =
    storedEmbed?.title ??
    fixed.embed_title ??
    '';

  const description =
    storedEmbed?.description ??
    fixed.embed_description ??
    '';

  let color =
    storedEmbed?.color ??
    fixed.embed_color ??
    0x5865F2;

  /*
   * Number → HEX
   */

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
   * Title
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
        String(title).slice(
          0,
          256
        )
      )
      .setRequired(true);

  /*
   * Description
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
        String(description).slice(
          0,
          4000
        )
      )
      .setRequired(true);

  /*
   * Color
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
 * =========================================================
 * Color parser
 * =========================================================
 */

function parseColor(
  value
) {
  const color =
    String(value || '')
      .trim()
      .replace(
        /^#/,
        ''
      );

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
 * =========================================================
 * Create Modal handler
 * =========================================================
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
        '❌ 既に固定メッセージが存在します。',
      flags:
        MessageFlags.Ephemeral
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
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  /*
   * Embed
   */

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

  const embedData = {
    title,
    description,
    color
  };

  try {
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
     * SQLite
     *
     * content は NOT NULL 対策で ''
     */

    createFixedMessage({
      guildId,

      channelId:
        interaction.channel.id,

      messageId:
        message.id,

      content:
        '',

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    await interaction.reply({
      content:
        '✅ 固定メッセージを作成しました。',
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Fixed message create error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの作成に失敗しました。',
      flags:
        MessageFlags.Ephemeral
    });
  }
}

/*
 * =========================================================
 * Edit Modal handler
 * =========================================================
 */

async function handleEditModal(interaction) {
  const guildId = interaction.guildId;

  const fixed = getFixedMessage(guildId);

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

  const color = parseColor(colorInput);

  if (color === null) {
    await interaction.reply({
      content:
        '❌ 色は6桁のHEX形式で入力してください。\n' +
        '例：`5865F2`',
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  const embed =
    new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color);

  const embedData = {
    title,
    description,
    color
  };

  try {
    /*
     * ==================================================
     * 1. 元のチャンネルを取得
     * ==================================================
     */

    const channel =
      await interaction.guild.channels.fetch(
        fixed.channel_id
      );

    if (!channel) {
      throw new Error(
        `チャンネルが見つかりません: ${fixed.channel_id}`
      );
    }

    /*
     * TextBased Channelか確認
     */

    if (
      !channel.isTextBased()
    ) {
      throw new Error(
        '固定メッセージのチャンネルがテキストチャンネルではありません。'
      );
    }

    /*
     * ==================================================
     * 2. 古い固定メッセージを削除
     * ==================================================
     */

    let oldMessage = null;

    try {
      oldMessage =
        await channel.messages.fetch(
          fixed.message_id
        );
    } catch (error) {
      console.log(
        '⚠️ 古い固定メッセージを取得できませんでした。'
      );

      console.log(
        error.message
      );
    }

    if (oldMessage) {
      try {
        await oldMessage.delete();

        console.log(
          `🗑️ 旧固定メッセージを削除: ${fixed.message_id}`
        );

      } catch (error) {
        console.error(
          '❌ 旧固定メッセージ削除失敗:',
          error
        );

        throw new Error(
          '旧固定メッセージを削除できませんでした。Botに「メッセージの管理」権限があるか確認してください。'
        );
      }
    }

    /*
     * ==================================================
     * 3. 新しい固定メッセージを送信
     *
     * channel.send() は現在のチャンネルの
     * 最新位置に新規メッセージを作成する。
     * ==================================================
     */

    const newMessage =
      await channel.send({
        embeds: [
          embed
        ]
      });

    console.log(
      `📌 新しい固定メッセージを送信: ${newMessage.id}`
    );

    /*
     * ==================================================
     * 4. SQLiteを更新
     * ==================================================
     */

    updateFixedMessage({
      guildId,

      channelId:
        channel.id,

      messageId:
        newMessage.id,

      /*
       * content NOT NULL対策
       */
      content: '',

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    /*
     * ==================================================
     * 5. 確認
     * ==================================================
     */

    const saved =
      getFixedMessage(
        guildId
      );

    console.log(
      '📌 固定メッセージDB更新:',
      {
        guildId,
        channelId: saved.channel_id,
        messageId: saved.message_id
      }
    );

    /*
     * ==================================================
     * 6. 管理者へ通知
     * ==================================================
     */

    await interaction.reply({
      content:
        '✅ 固定メッセージを更新しました。\n' +
        '📌 古いメッセージを削除し、新しいメッセージをチャンネル下部へ再送信しました。',
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {

    console.error(
      '❌ Fixed message edit error:'
    );

    console.error(
      error
    );

    /*
     * まだinteractionに返答していない場合
     */

    if (
      interaction.replied ||
      interaction.deferred
    ) {
      await interaction.followUp({
        content:
          `❌ 固定メッセージの更新に失敗しました。\n\`${error.message}\``,
        flags:
          MessageFlags.Ephemeral
      });

    } else {
      await interaction.reply({
        content:
          `❌ 固定メッセージの更新に失敗しました。\n\`${error.message}\``,
        flags:
          MessageFlags.Ephemeral
      });
    }
  }
}

/*
 * =========================================================
 * Delete
 * =========================================================
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
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  try {
    /*
     * Discordから削除
     */

    try {
      const channel =
        await interaction.guild.channels.fetch(
          fixed.channel_id
        );

      if (channel) {
        const message =
          await channel.messages.fetch(
            fixed.message_id
          );

        await message.delete();
      }

    } catch (error) {
      console.log(
        '⚠️ Discord上の固定メッセージは既に削除されています。'
      );
    }

    /*
     * SQLiteから削除
     */

    deleteFixedMessage(
      guildId
    );

    await interaction.reply({
      content:
        '🗑️ 固定メッセージを削除しました。',
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Fixed message delete error:',
      error
    );

    await interaction.reply({
      content:
        '❌ 固定メッセージの削除に失敗しました。',
      flags:
        MessageFlags.Ephemeral
    });
  }
}

/*
 * =========================================================
 * Show
 * =========================================================
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
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  const storedEmbed =
    getStoredEmbed(
      fixed
    );

  let status =
    '🟢 正常';

  /*
   * Discord上に存在するか確認
   */

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

  const description =
    storedEmbed?.description ??
    fixed.embed_description ??
    'なし';

  const title =
    storedEmbed?.title ??
    fixed.embed_title ??
    'なし';

  const updatedAt =
    Number(
      fixed.updated_at
    ) || Math.floor(
      Date.now() / 1000
    );

  const embed =
    new EmbedBuilder()
      .setTitle(
        '📌 固定メッセージ情報'
      )
      .setColor(
        0x5865F2
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
            `\`${fixed.message_id}\``
        },
        {
          name: 'タイトル',
          value:
            title.slice(
              0,
              1024
            )
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
            `<t:${updatedAt}:F>`
        }
      );

  await interaction.reply({
    embeds: [
      embed
    ],
    flags:
      MessageFlags.Ephemeral
  });
}

/*
 * =========================================================
 * Export
 * =========================================================
 *
 * これがないと
 *
 * ⚠️ dataがないためスキップ
 *
 * になる。
 * =========================================================
 */

module.exports = command;