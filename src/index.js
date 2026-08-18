const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

/*
 * =========================================================
 * Environment
 * =========================================================
 */

const TOKEN =
  process.env.DISCORD_TOKEN ||
  process.env.TOKEN;

if (!TOKEN) {
  console.error(
    '❌ DISCORD_TOKEN または TOKEN が設定されていません。'
  );

  process.exit(1);
}

/*
 * =========================================================
 * Client
 * =========================================================
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],

  partials: [
    Partials.GuildMember,
    Partials.User,
    Partials.Message,
    Partials.Channel
  ]
});

/*
 * =========================================================
 * Collections
 * =========================================================
 */

client.commands =
  new Collection();

/*
 * =========================================================
 * Commands Loader
 * =========================================================
 */

const commandsPath =
  path.join(
    __dirname,
    'commands'
  );

if (
  fs.existsSync(
    commandsPath
  )
) {
  const commandFiles =
    fs
      .readdirSync(
        commandsPath
      )
      .filter(
        file =>
          file.endsWith('.js')
      );

  for (
    const file of commandFiles
  ) {
    const filePath =
      path.join(
        commandsPath,
        file
      );

    try {
      const command =
        require(filePath);

      /*
       * Discord Slash Commandとして
       * 必須のdata / executeを確認
       */

      if (
        !command ||
        !command.data
      ) {
        console.warn(
          `⚠️ dataがないためスキップ: ${file}`
        );

        continue;
      }

      if (
        typeof command.execute !==
        'function'
      ) {
        console.warn(
          `⚠️ executeがないためスキップ: ${file}`
        );

        continue;
      }

      const commandName =
        command.data.name;

      if (!commandName) {
        console.warn(
          `⚠️ command nameがないためスキップ: ${file}`
        );

        continue;
      }

      client.commands.set(
        commandName,
        command
      );

      console.log(
        `✅ コマンド読み込み: ${commandName}`
      );

    } catch (error) {
      console.error(
        `❌ コマンド読み込み失敗: ${file}`
      );

      console.error(
        error
      );
    }
  }

} else {
  console.warn(
    `⚠️ commandsディレクトリがありません: ${commandsPath}`
  );
}

/*
 * =========================================================
 * Events Loader
 * =========================================================
 */

const eventsPath =
  path.join(
    __dirname,
    'events'
  );

if (
  fs.existsSync(
    eventsPath
  )
) {
  const eventFiles =
    fs
      .readdirSync(
        eventsPath
      )
      .filter(
        file =>
          file.endsWith('.js')
      );

  for (
    const file of eventFiles
  ) {
    const filePath =
      path.join(
        eventsPath,
        file
      );

    try {
      const event =
        require(filePath);

      /*
       * events/xxx.js は
       *
       * module.exports = {
       *   name: 'ready',
       *   once: true,
       *   execute(...) {}
       * }
       *
       * の形式を想定
       */

      if (
        !event ||
        !event.name
      ) {
        console.warn(
          `⚠️ event nameがないためスキップ: ${file}`
        );

        continue;
      }

      if (
        typeof event.execute !==
        'function'
      ) {
        console.warn(
          `⚠️ event executeがないためスキップ: ${file}`
        );

        continue;
      }

      if (event.once) {
        client.once(
          event.name,
          (...args) =>
            event.execute(
              ...args
            )
        );
      } else {
        client.on(
          event.name,
          (...args) =>
            event.execute(
              ...args
            )
        );
      }

      console.log(
        `✅ イベント読み込み: ${event.name}`
      );

    } catch (error) {
      console.error(
        `❌ イベント読み込み失敗: ${file}`
      );

      console.error(
        error
      );
    }
  }

} else {
  console.warn(
    `⚠️ eventsディレクトリがありません: ${eventsPath}`
  );
}

/*
 * =========================================================
 * Interaction Create
 * =========================================================
 */

client.on(
  'interactionCreate',
  async interaction => {

    /*
     * =====================================================
     * Slash Command
     * =====================================================
     */

    if (
      interaction.isChatInputCommand()
    ) {
      const command =
        client.commands.get(
          interaction.commandName
        );

      if (!command) {
        console.warn(
          `⚠️ コマンドが見つかりません: ${interaction.commandName}`
        );

        return;
      }

      try {
        await command.execute(
          interaction
        );

      } catch (error) {
        console.error(
          `❌ Command error: ${interaction.commandName}`
        );

        console.error(
          error
        );

        await sendErrorReply(
          interaction,
          'コマンド実行中にエラーが発生しました。'
        );
      }

      return;
    }

    /*
     * =====================================================
     * Modal Submit
     * =====================================================
     */

    if (
      interaction.isModalSubmit()
    ) {

      /*
       * ---------------------------------------------------
       * 固定メッセージ
       * ---------------------------------------------------
       */

      if (
        interaction.customId ===
          'fixed-message-create' ||
        interaction.customId ===
          'fixed-message-edit'
      ) {
        const command =
          client.commands.get(
            'fixed-message'
          );

        if (
          !command
        ) {
          console.error(
            '❌ fixed-message コマンドが読み込まれていません。'
          );

          await sendErrorReply(
            interaction,
            '固定メッセージ機能を読み込めませんでした。'
          );

          return;
        }

        if (
          typeof command.handleModal !==
          'function'
        ) {
          console.error(
            '❌ fixed-message.handleModal が存在しません。'
          );

          await sendErrorReply(
            interaction,
            '固定メッセージのModal処理が見つかりません。'
          );

          return;
        }

        try {
          await command.handleModal(
            interaction
          );

        } catch (error) {
          console.error(
            '❌ Fixed message modal error:'
          );

          console.error(
            error
          );

          await sendErrorReply(
            interaction,
            '固定メッセージの処理中にエラーが発生しました。'
          );
        }

        return;
      }

      /*
       * ---------------------------------------------------
       * その他のModal
       * ---------------------------------------------------
       *
       * customIdを持つコマンドに
       * handleModalがある場合は自動転送
       */

      for (
        const [
          commandName,
          command
        ] of client.commands
      ) {
        if (
          typeof command.handleModal !==
          'function'
        ) {
          continue;
        }

        try {
          const handled =
            await command.handleModal(
              interaction
            );

          if (
            handled === true
          ) {
            return;
          }

        } catch (error) {
          console.error(
            `❌ Modal error: ${commandName}`
          );

          console.error(
            error
          );

          await sendErrorReply(
            interaction,
            'Modal処理中にエラーが発生しました。'
          );

          return;
        }
      }

      return;
    }

    /*
     * =====================================================
     * Button
     * =====================================================
     */

    if (
      interaction.isButton()
    ) {

      /*
       * 各コマンドのhandleButtonへ
       */

      for (
        const [
          commandName,
          command
        ] of client.commands
      ) {
        if (
          typeof command.handleButton !==
          'function'
        ) {
          continue;
        }

        try {
          const handled =
            await command.handleButton(
              interaction
            );

          if (
            handled === true
          ) {
            return;
          }

        } catch (error) {
          console.error(
            `❌ Button error: ${commandName}`
          );

          console.error(
            error
          );

          await sendErrorReply(
            interaction,
            'ボタン処理中にエラーが発生しました。'
          );

          return;
        }
      }

      return;
    }

    /*
     * =====================================================
     * String Select Menu
     * =====================================================
     */

    if (
      interaction.isStringSelectMenu()
    ) {

      for (
        const [
          commandName,
          command
        ] of client.commands
      ) {
        if (
          typeof command.handleSelectMenu !==
          'function'
        ) {
          continue;
        }

        try {
          const handled =
            await command.handleSelectMenu(
              interaction
            );

          if (
            handled === true
          ) {
            return;
          }

        } catch (error) {
          console.error(
            `❌ SelectMenu error: ${commandName}`
          );

          console.error(
            error
          );

          await sendErrorReply(
            interaction,
            'メニュー処理中にエラーが発生しました。'
          );

          return;
        }
      }

      return;
    }

    /*
     * =====================================================
     * User Select Menu
     * =====================================================
     */

    if (
      interaction.isUserSelectMenu()
    ) {

      for (
        const [
          commandName,
          command
        ] of client.commands
      ) {
        if (
          typeof command.handleUserSelectMenu !==
          'function'
        ) {
          continue;
        }

        try {
          const handled =
            await command.handleUserSelectMenu(
              interaction
            );

          if (
            handled === true
          ) {
            return;
          }

        } catch (error) {
          console.error(
            `❌ UserSelectMenu error: ${commandName}`
          );

          console.error(
            error
          );

          await sendErrorReply(
            interaction,
            'ユーザー選択処理中にエラーが発生しました。'
          );

          return;
        }
      }

      return;
    }
  }
);

/*
 * =========================================================
 * Error Reply
 * =========================================================
 */

async function sendErrorReply(
  interaction,
  message
) {
  try {

    if (
      interaction.replied ||
      interaction.deferred
    ) {
      await interaction.followUp({
        content:
          `❌ ${message}`,
        flags:
          MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.reply({
      content:
        `❌ ${message}`,
      flags:
        MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error(
      '❌ Error reply failed:',
      error
    );
  }
}

/*
 * =========================================================
 * Client Errors
 * =========================================================
 */

client.on(
  'error',
  error => {
    console.error(
      '❌ Discord Client Error:',
      error
    );
  }
);

client.on(
  'warn',
  warning => {
    console.warn(
      '⚠️ Discord Client Warning:',
      warning
    );
  }
);

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ Unhandled Promise Rejection:',
      error
    );
  }
);

process.on(
  'uncaughtException',
  error => {
    console.error(
      '❌ Uncaught Exception:',
      error
    );
  }
);

/*
 * =========================================================
 * Login
 * =========================================================
 */

client
  .login(TOKEN)
  .then(() => {
    console.log(
      '🔄 Discordへ接続しています...'
    );
  })
  .catch(error => {
    console.error(
      '❌ Discord Login Error:',
      error
    );

    process.exit(1);
  });