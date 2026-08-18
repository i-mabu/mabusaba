const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  MessageFlags
} = require('discord.js');

const {
  getWelcomeMessage,
  createWelcomeMessage,
  updateWelcomeMessage,
  deleteWelcomeMessage,
  getStoredEmbed
} = require('../utils/welcomeMessage');

/*
 * =========================================================
 * Command
 * =========================================================
 */

const command = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Welcomeメッセージを管理します')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Welcomeメッセージを作成します')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription(
              'Welcomeを送信するチャンネル'
            )
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement
            )
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Welcomeメッセージを編集します')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription(
              'Welcomeを送信するチャンネル'
            )
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement
            )
            .setRequired(false)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription(
          'Welcomeメッセージ設定を削除します'
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          'Welcomeメッセージ設定を表示します'
        )
    ),

  /*
   * =======================================================
   * Execute
   * =======================================================
   */

  async execute(interaction) {
    try {
      if (!interaction.guild) {
        await interaction.reply({
          content:
            '❌ このコマンドはサーバー内でのみ使用できます。',
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

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

      if (
        subcommand === 'create'
      ) {
        await showCreateModal(
          interaction
        );

        return;
      }

      if (
        subcommand === 'edit'
      ) {
        await showEditModal(
          interaction
        );

        return;
      }

      if (
        subcommand === 'delete'
      ) {
        await handleDelete(
          interaction
        );

        return;
      }

      if (
        subcommand === 'show'
      ) {
        await handleShow(
          interaction
        );

        return;
      }

    } catch (error) {
      console.error(
        '❌ /welcome error:',
        error
      );

      await safeReply(
        interaction,
        `Welcomeコマンドでエラーが発生しました。\n\`${error.message}\``
      );
    }
  },

  /*
   * =======================================================
   * Modal Handler
   * =======================================================
   */

  async handleModal(interaction) {
    if (
      !interaction.isModalSubmit()
    ) {
      return false;
    }

    /*
     * welcome-create:CHANNEL_ID
     */

    if (
      interaction.customId.startsWith(
        'welcome-create:'
      )
    ) {
      await handleCreateModal(
        interaction
      );

      return true;
    }

    /*
     * welcome-edit:CHANNEL_ID
     */

    if (
      interaction.customId.startsWith(
        'welcome-edit:'
      )
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
 * =========================================================
 * Create Modal
 * =========================================================
 */

async function showCreateModal(
  interaction
) {
  const existing =
    getWelcomeMessage(
      interaction.guildId
    );

  if (existing) {
    await interaction.reply({
      content:
        '❌ このサーバーには既にWelcomeメッセージが設定されています。\n' +
        '`/welcome edit` で編集してください。',
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  const channel =
    interaction.options.getChannel(
      'channel'
    );

  if (!channel) {
    await interaction.reply({
      content:
        '❌ チャンネルを指定してください。',
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  /*
   * Modal
   */

  const modal =
    new ModalBuilder()
      .setCustomId(
        `welcome-create:${channel.id}`
      )
      .setTitle(
        '👋 Welcomeメッセージ作成'
      );

  /*
   * タイトル
   */

  const titleInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-title'
      )
      .setLabel(
        'タイトル'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setPlaceholder(
        '🎉 まぶ鯖へようこそ！'
      )
      .setMaxLength(256)
      .setRequired(true);

  /*
   * 本文
   */

  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-description'
      )
      .setLabel(
        '本文（複数行対応）'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setPlaceholder(
        'ようこそ {user} さん！\n\n{server} へ参加してくれてありがとうございます！'
      )
      .setMaxLength(4000)
      .setRequired(true);

  /*
   * 色
   */

  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-color'
      )
      .setLabel(
        '色（HEX 6桁）'
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
      .setMinLength(6)
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
  const welcome =
    getWelcomeMessage(
      interaction.guildId
    );

  if (!welcome) {
    await interaction.reply({
      content:
        '❌ Welcomeメッセージが設定されていません。\n' +
        '`/welcome create` で作成してください。',
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  /*
   * チャンネル変更指定があれば使用
   */

  const selectedChannel =
    interaction.options.getChannel(
      'channel'
    );

  const channelId =
    selectedChannel?.id ||
    welcome.channel_id;

  /*
   * Embed復元
   */

  const storedEmbed =
    getStoredEmbed(
      welcome
    );

  let title =
    storedEmbed?.title ??
    welcome.embed_title ??
    '';

  let description =
    storedEmbed?.description ??
    welcome.embed_description ??
    '';

  let color =
    storedEmbed?.color ??
    welcome.embed_color ??
    '5865F2';

  /*
   * 色を文字列化
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
        );
  }

  color =
    String(color)
      .replace(
        /^#/,
        ''
      )
      .toUpperCase();

  if (
    !/^[0-9A-F]{6}$/.test(
      color
    )
  ) {
    color =
      '5865F2';
  }

  /*
   * Discord Modal Inputの制限に合わせる
   */

  title =
    String(title).slice(
      0,
      256
    );

  description =
    String(description).slice(
      0,
      4000
    );

  /*
   * Modal
   */

  const modal =
    new ModalBuilder()
      .setCustomId(
        `welcome-edit:${channelId}`
      )
      .setTitle(
        '👋 Welcomeメッセージ編集'
      );

  const titleInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-title'
      )
      .setLabel(
        'タイトル'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setMaxLength(256)
      .setValue(
        title || 'Welcome'
      )
      .setRequired(true);

  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-description'
      )
      .setLabel(
        '本文（複数行対応）'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setMaxLength(4000)
      .setValue(
        description ||
        'ようこそ {user} さん！'
      )
      .setRequired(true);

  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-color'
      )
      .setLabel(
        '色（HEX 6桁）'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setMinLength(6)
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
 * Color Parser
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
 * Create Modal Handler
 * =========================================================
 */

async function handleCreateModal(
  interaction
) {
  try {
    const guildId =
      interaction.guildId;

    const parts =
      interaction.customId.split(':');

    const channelId =
      parts[1];

    if (!channelId) {
      throw new Error(
        '送信先チャンネル情報がありません。'
      );
    }

    /*
     * 二重作成防止
     */

    const existing =
      getWelcomeMessage(
        guildId
      );

    if (existing) {
      await interaction.reply({
        content:
          '❌ 既にWelcomeメッセージが設定されています。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    /*
     * 入力値
     */

    const title =
      interaction.fields.getTextInputValue(
        'welcome-title'
      );

    const description =
      interaction.fields.getTextInputValue(
        'welcome-description'
      );

    const colorInput =
      interaction.fields.getTextInputValue(
        'welcome-color'
      );

    /*
     * 色
     */

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
     * チャンネル確認
     */

    const channel =
      await interaction.guild.channels.fetch(
        channelId
      );

    if (!channel) {
      throw new Error(
        '指定されたチャンネルが存在しません。'
      );
    }

    if (
      !channel.isTextBased()
    ) {
      throw new Error(
        '指定されたチャンネルはテキストチャンネルではありません。'
      );
    }

    /*
     * Embedデータ
     */

    const embedData = {
      title:
        String(title).slice(
          0,
          256
        ),

      description:
        String(description).slice(
          0,
          4000
        ),

      color
    };

    /*
     * SQLite保存
     *
     * contentは必ず空文字を入れる
     */

    createWelcomeMessage({
      guildId,

      channelId,

      content: '',

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    console.log(
      `👋 Welcome設定作成: ${guildId}`
    );

    await interaction.reply({
      content:
        `✅ Welcomeメッセージを設定しました。\n` +
        `📢 送信先: <#${channelId}>`,
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Welcome create error:',
      error
    );

    await safeReply(
      interaction,
      `Welcome設定の作成に失敗しました。\n\`${error.message}\``
    );
  }
}

/*
 * =========================================================
 * Edit Modal Handler
 * =========================================================
 */

async function handleEditModal(
  interaction
) {
  try {
    const guildId =
      interaction.guildId;

    const existing =
      getWelcomeMessage(
        guildId
      );

    if (!existing) {
      await interaction.reply({
        content:
          '❌ Welcomeメッセージが設定されていません。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    const parts =
      interaction.customId.split(':');

    const channelId =
      parts[1] ||
      existing.channel_id;

    /*
     * 入力値
     */

    const title =
      interaction.fields.getTextInputValue(
        'welcome-title'
      );

    const description =
      interaction.fields.getTextInputValue(
        'welcome-description'
      );

    const colorInput =
      interaction.fields.getTextInputValue(
        'welcome-color'
      );

    /*
     * 色
     */

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
     * チャンネル
     */

    const channel =
      await interaction.guild.channels.fetch(
        channelId
      );

    if (!channel) {
      throw new Error(
        '指定されたチャンネルが存在しません。'
      );
    }

    if (
      !channel.isTextBased()
    ) {
      throw new Error(
        '指定されたチャンネルはテキストチャンネルではありません。'
      );
    }

    /*
     * Embed
     */

    const embedData = {
      title:
        String(title).slice(
          0,
          256
        ),

      description:
        String(description).slice(
          0,
          4000
        ),

      color
    };

    /*
     * SQLite更新
     */

    updateWelcomeMessage({
      guildId,

      channelId,

      content: '',

      embed:
        embedData,

      userId:
        interaction.user.id
    });

    console.log(
      `👋 Welcome設定更新: ${guildId}`
    );

    await interaction.reply({
      content:
        `✅ Welcomeメッセージを更新しました。\n` +
        `📢 送信先: <#${channelId}>`,
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Welcome edit error:',
      error
    );

    await safeReply(
      interaction,
      `Welcome設定の更新に失敗しました。\n\`${error.message}\``
    );
  }
}

/*
 * =========================================================
 * Delete
 * =========================================================
 */

async function handleDelete(
  interaction
) {
  try {
    const existing =
      getWelcomeMessage(
        interaction.guildId
      );

    if (!existing) {
      await interaction.reply({
        content:
          '❌ Welcomeメッセージは設定されていません。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    deleteWelcomeMessage(
      interaction.guildId
    );

    console.log(
      `🗑️ Welcome設定削除: ${interaction.guildId}`
    );

    await interaction.reply({
      content:
        '🗑️ Welcomeメッセージ設定を削除しました。',
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Welcome delete error:',
      error
    );

    await safeReply(
      interaction,
      `Welcome設定の削除に失敗しました。\n\`${error.message}\``
    );
  }
}

/*
 * =========================================================
 * Show
 * =========================================================
 */

async function handleShow(
  interaction
) {
  try {
    const welcome =
      getWelcomeMessage(
        interaction.guildId
      );

    if (!welcome) {
      await interaction.reply({
        content:
          '👋 Welcomeメッセージは設定されていません。',
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    const storedEmbed =
      getStoredEmbed(
        welcome
      );

    const title =
      storedEmbed?.title ??
      welcome.embed_title ??
      'なし';

    const description =
      storedEmbed?.description ??
      welcome.embed_description ??
      'なし';

    const updatedAt =
      Number(
        welcome.updated_at ||
        0
      );

    const embed =
      new EmbedBuilder()
        .setTitle(
          '👋 Welcomeメッセージ設定'
        )
        .setColor(
          0x5865F2
        )
        .addFields(
          {
            name: '送信先',
            value:
              `<#${welcome.channel_id}>`,
            inline: true
          },
          {
            name: 'タイトル',
            value:
              String(title).slice(
                0,
                1024
              )
          },
          {
            name: '本文',
            value:
              String(description).slice(
                0,
                1024
              )
          }
        );

    if (
      updatedAt > 0
    ) {
      embed.addFields({
        name: '最終更新',
        value:
          `<t:${updatedAt}:F>`
      });
    }

    await interaction.reply({
      embeds: [
        embed
      ],
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Welcome show error:',
      error
    );

    await safeReply(
      interaction,
      `Welcome設定の取得に失敗しました。\n\`${error.message}\``
    );
  }
}

/*
 * =========================================================
 * Safe Reply
 * =========================================================
 */

async function safeReply(
  interaction,
  content
) {
  try {
    if (
      interaction.replied ||
      interaction.deferred
    ) {
      await interaction.followUp({
        content:
          `❌ ${content}`,
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.reply({
      content:
        `❌ ${content}`,
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Welcome safeReply error:',
      error
    );
  }
}

module.exports = command;