require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ==============================
// Client
// ==============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==============================
// Commands
// ==============================

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(
        `[WARNING] ${file} に data または execute がありません。`
      );
      continue;
    }

    client.commands.set(command.data.name, command);
  }
}

// ==============================
// Events
// ==============================

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(
        `[WARNING] ${file} に name または execute がありません。`
      );
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// ==============================
// Interaction Handler
// ==============================

client.on(Events.InteractionCreate, async interaction => {
  // Slash Command
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(
        `コマンド「${interaction.commandName}」が見つかりません。`
      );
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `コマンド「${interaction.commandName}」の実行中にエラーが発生しました:`,
        error
      );

      const message = {
        content: '❌ コマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message).catch(console.error);
      } else {
        await interaction.reply(message).catch(console.error);
      }
    }
  }
});

// ==============================
// Error Handling
// ==============================

client.on(Events.Error, error => {
  console.error('Discord Client Error:', error);
});

client.on(Events.Warn, warning => {
  console.warn('Discord Warning:', warning);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

// ==============================
// Login
// ==============================

if (!process.env.DISCORD_TOKEN) {
  console.error(
    '❌ DISCORD_TOKEN が .env に設定されていません。'
  );
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);