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
    .setDescription(
      'Welcomeメッセージを管理します'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription(
          'Welcomeメッセージを作成します'
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription(
              'Welcomeメッセージを送信するチャンネル'
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
        .setDescription(
          'Welcomeメッセージを編集します'
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription(
              'Welcomeメッセージを送信するチャンネル'
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
          'Welcomeメッセージを削除します'
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription(
          'Welcomeメッセージ設定を確認します'
        )
    ),

  /*
   * =======================================================
   * Execute
   * =======================================================
   */

  async execute(interaction) {
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
    }
  },

  /*
   * =======================================================
   * Modal
   * =======================================================
   */

  async handleModal(interaction) {
    if (
      !interaction.isModalSubmit()
    ) {
      return false;
    }

    if (
      interaction.customId ===
      'welcome-create'
    ) {
      await handleCreateModal(
        interaction
      );

      return true;
    }

    if (
      interaction.customId ===
      'welcome-edit'
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
        '❌ 既にWelcomeメッセージが設定されています。\n' +
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

  const modal =
    new ModalBuilder()
      .setCustomId(
        `welcome-create`
      )
      .setTitle(
        '👋 Welcomeメッセージ作成'
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
      .setPlaceholder(
        '🎉 ようこそ！'
      )
      .setMaxLength(256)
      .setRequired(true);

  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-description'
      )
      .setLabel(
        '本文'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setPlaceholder(
        'サーバーへようこそ！\nここからルールを確認してください。'
      )
      .setMaxLength(4000)
      .setRequired(true);

  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-color'
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

  /*
   * channel IDはModalのcustomIdに入れる。
   */

  modal.setCustomId(
    `welcome-create:${channel.id}`
  );

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

  const selectedChannel =
    interaction.options.getChannel(
      'channel'
    );

  const channelId =
    selectedChannel?.id ||
    welcome.channel_id;

  const storedEmbed =
    getStoredEmbed(
      welcome
    );

  const title =
    storedEmbed?.title ??
    welcome.embed_title ??
    '';

  const description =
    storedEmbed?.description ??
    welcome.embed_description ??
    '';

  let color =
    storedEmbed?.color ??
    welcome.embed_color ??
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
        String(title).slice(
          0,
          256
        )
      )
      .setRequired(true);

  const descriptionInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-description'
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

  const colorInput =
    new TextInputBuilder()
      .setCustomId(
        'welcome-color'
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
 * Color
 * =========================================================
 */

function parseColor(value) {
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
 * Create Modal
 * =========================================================
 */

async function handleCreateModal(
  interaction
) {
  const guildId =
    interaction.guildId;

  const parts =
    interaction.customId.split(':');

  const channelId =
    parts[1];

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

  try {
    const channel =
      await interaction.guild.channels.fetch(
        channelId
      );

    if (!channel) {
      throw new Error(
        '指定されたチャンネルが見つかりません。'
      );
    }

    if (
      !channel.isTextBased()
    ) {
      throw new Error(
        '指定されたチャンネルはテキストチャンネルではありません。'
      );
    }

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

    /*
     * 設定保存
     *
     * Welcomeは参加者ごとに送信するので
     * 作成時にはDiscordへテスト送信しない。
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

    await interaction.reply({
      content:
        `❌ Welcomeメッセージの設定に失敗しました。\n\`${error.message}\``,
      flags:
        MessageFlags.Ephemeral
    });
  }
}

/*
 * =========================================================
 * Edit Modal
 * =========================================================
 */

async function handleEditModal(
  interaction
) {
  const guildId =
    interaction.guildId;

  const welcome =
    getWelcomeMessage(
      guildId
    );

  if (!welcome) {
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
    welcome.channel_id;

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

  try {
    const channel =
      await interaction.guild.channels.fetch(
        channelId
      );

    if (!channel) {
      throw new Error(
        '指定されたチャンネルが見つかりません。'
      );
    }

    if (
      !channel.isTextBased()
    ) {
      throw new Error(
        '指定されたチャンネルはテキストチャンネルではありません。'
      );
    }

    const embedData = {
      title,
      description,
      color
    };

    updateWelcomeMessage({
      guildId,

      channelId,

      content: '',

      embed:
        embedData,

      userId:
        interaction.user.id
    });

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

    await interaction.reply({
      content:
        `❌ Welcomeメッセージの更新に失敗しました。\n\`${error.message}\``,
      flags:
        MessageFlags.Ephemeral
    });
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

  const welcome =
    getWelcomeMessage(
      guildId
    );

  if (!welcome) {
    await interaction.reply({
      content:
        '❌ Welcomeメッセージは設定されていません。',
      flags:
        MessageFlags.Ephemeral
    });

    return;
  }

  try {
    deleteWelcomeMessage(
      guildId
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

    await interaction.reply({
      content:
        '❌ Welcomeメッセージ設定の削除に失敗しました。',
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
      welcome.updated_at
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

module.exports = command;