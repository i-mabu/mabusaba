require('dotenv').config();

const {
  Client,
  Collection,
  GatewayIntentBits,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

/*
 * =========================
 * Commands
 * =========================
 */

const commandsPath = path.join(
  __dirname,
  'commands'
);

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(
    commandsPath,
    file
  );

  try {
    const command = require(filePath);

    if (
      !command.data ||
      !command.execute
    ) {
      console.warn(
        `⚠️ 無効なコマンド: ${file}`
      );
      continue;
    }

    client.commands.set(
      command.data.name,
      command
    );

    console.log(
      `📦 Command loaded: /${command.data.name}`
    );
  } catch (error) {
    console.error(
      `❌ Command読み込み失敗: ${file}`,
      error
    );
  }
}

/*
 * =========================
 * Events
 * =========================
 */

const eventsPath = path.join(
  __dirname,
  'events'
);

const eventFiles = fs
  .readdirSync(eventsPath)
  .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(
    eventsPath,
    file
  );

  try {
    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(
        `⚠️ 無効なEvent: ${file}`
      );
      continue;
    }

    if (event.once) {
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
      `⚡ Event loaded: ${event.name}`
    );
  } catch (error) {
    console.error(
      `❌ Event読み込み失敗: ${file}`,
      error
    );
  }
}

/*
 * =========================
 * Interaction
 * =========================
 */

client.on(
  'interactionCreate',
  async interaction => {
    /*
     * ========================================
     * Slash Command
     * ========================================
     */
    if (
      interaction.isChatInputCommand()
    ) {
      const command =
        client.commands.get(
          interaction.commandName
        );

      if (!command) {
        return;
      }

      try {
        await command.execute(
          interaction
        );
      } catch (error) {
        console.error(
          'Command error:',
          error
        );

        try {
          if (
            interaction.replied ||
            interaction.deferred
          ) {
            await interaction.followUp({
              content:
                '❌ コマンド実行中にエラーが発生しました。',
              flags:
                MessageFlags.Ephemeral
            });
          } else {
            await interaction.reply({
              content:
                '❌ コマンド実行中にエラーが発生しました。',
              flags:
                MessageFlags.Ephemeral
            });
          }
        } catch (replyError) {
          console.error(
            'Reply error:',
            replyError
          );
        }
      }

      return;
    }

    /*
     * ========================================
     * Modal
     * ========================================
     */
    if (
      interaction.isModalSubmit()
    ) {
      /*
       * fixed-message
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
          command &&
          typeof command.handleModal ===
            'function'
        ) {
          try {
            await command.handleModal(
              interaction
            );
          } catch (error) {
            console.error(
              'Modal error:',
              error
            );

            try {
              if (
                interaction.replied ||
                interaction.deferred
              ) {
                await interaction.followUp({
                  content:
                    '❌ Modal処理中にエラーが発生しました。',
                  flags:
                    MessageFlags.Ephemeral
                });
              } else {
                await interaction.reply({
                  content:
                    '❌ Modal処理中にエラーが発生しました。',
                  flags:
                    MessageFlags.Ephemeral
                });
              }
            } catch (replyError) {
              console.error(
                'Modal reply error:',
                replyError
              );
            }
          }
        }

        return;
      }
    }
  }
);

/*
 * =========================
 * Login
 * =========================
 */

client.login(
  process.env.DISCORD_TOKEN
);