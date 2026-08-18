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
    if (!interaction.isChatInputCommand()) {
      return;
    }

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
        `/${interaction.commandName} 実行エラー:`,
        error
      );

      const message =
        '❌ コマンドの実行中にエラーが発生しました。';

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction.editReply({
          content: message,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: message,
          ephemeral: true,
        }).catch(() => {});
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