require('dotenv').config();

const {
  REST,
  Routes,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ==============================
// Environment Check
// ==============================

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
} = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN が .env に設定されていません。');
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error('❌ CLIENT_ID が .env に設定されていません。');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('❌ GUILD_ID が .env に設定されていません。');
  process.exit(1);
}

// ==============================
// Load Commands
// ==============================

const commands = [];

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ commands フォルダが見つかりません。');
  process.exit(1);
}

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command.data || !command.execute) {
    console.warn(
      `⚠️ ${file} は正しいコマンド形式ではありません。スキップします。`
    );
    continue;
  }

  commands.push(command.data.toJSON());

  console.log(`📦 コマンド読み込み: /${command.data.name}`);
}

// ==============================
// Deploy Commands
// ==============================

const rest = new REST({
  version: '10',
}).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('');
    console.log('🔄 Slash Commandを登録しています...');
    console.log(`📡 Server ID: ${GUILD_ID}`);
    console.log(`📦 Command数: ${commands.length}`);
    console.log('');

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      {
        body: commands,
      }
    );

    console.log('✅ Slash Commandの登録が完了しました！');
    console.log('');
  } catch (error) {
    console.error('❌ Slash Commandの登録に失敗しました。');
    console.error(error);
    process.exit(1);
  }
})();