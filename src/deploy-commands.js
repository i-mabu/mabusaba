require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require('discord.js');

const fs =
  require('fs');

const path =
  require('path');

/*
 * =========================================================
 * Client
 * =========================================================
 */

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildMembers,

      GatewayIntentBits.GuildMessages,

      GatewayIntentBits.MessageContent,

      GatewayIntentBits.GuildModeration
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
 * Commands
 * =========================================================
 */

client.commands =
  new Collection();

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
    try {
      const filePath =
        path.join(
          commandsPath,
          file
        );

      delete require.cache[
        require.resolve(
          filePath
        )
      ];

      const command =
        require(filePath);

      if (
        command.data &&
        command.execute
      ) {
        client.commands.set(
          command.data.name,
          command
        );

        console.log(
          `✅ コマンド読み込み: ${command.data.name}`
        );
      } else {
        console.warn(
          `⚠️ コマンド形式不正: ${file}`
        );
      }

    } catch (error) {
      console.error(
        `❌ コマンド読み込み失敗: ${file}`,
        error
      );
    }
  }
}

/*
 * =========================================================
 * Events
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
    try {
      const filePath =
        path.join(
          eventsPath,
          file
        );

      delete require.cache[
        require.resolve(
          filePath
        )
      ];

      const event =
        require(filePath);

      if (
        !event.name ||
        !event.execute
      ) {
        console.warn(
          `⚠️ イベント形式不正: ${file}`
        );

        continue;
      }

      if (
        event.once
      ) {
        client.once(
          event.name,
          (...args) =>
            event.execute(
              ...args,
              client
            )
        );
      } else {
        client.on(
          event.name,
          (...args) =>
            event.execute(
              ...args,
              client
            )
        );
      }

      console.log(
        `✅ イベント読み込み: ${event.name}`
      );

    } catch (error) {
      console.error(
        `❌ イベント読み込み失敗: ${file}`,
        error
      );
    }
  }
}

/*
 * =========================================================
 * Interaction
 * =========================================================
 */

client.on(
  'interactionCreate',
  async interaction => {
    try {
      /*
       * Slash Command
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
            `⚠️ 未登録コマンド: ${interaction.commandName}`
          );

          return;
        }

        await command.execute(
          interaction
        );

        return;
      }

      /*
       * Modal
       */

      if (
        interaction.isModalSubmit()
      ) {
        /*
         * すべてのコマンドから
         * handleModalを探す
         */

        for (
          const command
          of client.commands.values()
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

            if (handled) {
              return;
            }

          } catch (error) {
            console.error(
              '❌ Modal処理エラー:',
              error
            );

            if (
              !interaction.replied &&
              !interaction.deferred
            ) {
              await interaction.reply({
                content:
                  `❌ 入力処理中にエラーが発生しました。\n\`${error.message}\``,
                flags:
                  require('discord.js')
                    .MessageFlags
                    .Ephemeral
              });
            }

            return;
          }
        }

        return;
      }

      /*
       * Button
       *
       * 既存のボタン処理がある場合は
       * ここへ追加できます。
       */

    } catch (error) {
      console.error(
        '❌ interactionCreate error:',
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              '❌ 処理中にエラーが発生しました。',
            flags:
              require('discord.js')
                .MessageFlags
                .Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              '❌ 処理中にエラーが発生しました。',
            flags:
              require('discord.js')
                .MessageFlags
                .Ephemeral
          });
        }
      } catch {}
    }
  }
);

/*
 * =========================================================
 * Error
 * =========================================================
 */

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ Unhandled Rejection:',
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

if (!process.env.DISCORD_TOKEN) {
  console.error(
    '❌ DISCORD_TOKEN が設定されていません。'
  );

  process.exit(1);
}

client.login(
  process.env.DISCORD_TOKEN
);