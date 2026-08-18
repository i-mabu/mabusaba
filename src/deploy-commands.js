require('dotenv').config();

const {
  REST,
  Routes,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const commands = [];

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

    if (!command.data) {
      console.warn(
        `⚠️ dataがないためスキップ: ${file}`
      );
      continue;
    }

    commands.push(
      command.data.toJSON()
    );

    console.log(
      `📦 登録: /${command.data.name}`
    );
  } catch (error) {
    console.error(
      `❌ 読み込み失敗: ${file}`,
      error
    );
  }
}

const rest = new REST({
  version: '10',
}).setToken(
  process.env.DISCORD_TOKEN
);

(async () => {
  try {
    console.log(
      `🔄 ${commands.length}個のコマンドを登録します...`
    );

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands,
      }
    );

    console.log(
      '✅ Slash Commandの登録完了'
    );
  } catch (error) {
    console.error(
      '❌ Slash Command登録失敗:',
      error
    );

    process.exit(1);
  }
})();