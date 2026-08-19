'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mabusaba-main-verify-'));
process.env.MABUSABA_DATA_DIR = dataDir;
process.env.DB_BACKUP_ON_START = 'false';

const legacyPath = path.join(dataDir, 'games.db');
const legacy = new Database(legacyPath);
legacy.exec(`
  CREATE TABLE fixed_messages (
    guild_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, message_id TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '', embed_title TEXT, embed_description TEXT,
    embed_color TEXT, embed_data TEXT, created_by TEXT NOT NULL, updated_by TEXT NOT NULL,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE TABLE welcome_messages (
    guild_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
    embed_title TEXT, embed_description TEXT, embed_color TEXT, embed_data TEXT,
    created_by TEXT NOT NULL, updated_by TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
`);
legacy.prepare('INSERT INTO fixed_messages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
  'guild-fixed', 'channel-fixed', 'message-fixed', '固定本文', '固定タイトル', null, null, null,
  'owner', 'owner', 1, 1
);
legacy.prepare('INSERT INTO welcome_messages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
  'guild-welcome', 'channel-welcome', '歓迎本文', '歓迎タイトル', null, null, null,
  'owner', 'owner', 1, 1
);
legacy.close();

const { migrateDatabase } = require('../src/utils/database');
const firstReport = migrateDatabase();
assert.equal(firstReport.legacy.fixedMessages.imported, 1, '固定メッセージを移行できること');
assert.equal(firstReport.legacy.welcomeMessages.imported, 1, '歓迎メッセージを移行できること');
assert.ok(fs.existsSync(path.join(dataDir, 'moderation.db')), '管理用DBを作成すること');

const { getFixedMessage, deleteFixedMessage, createFixedMessage } = require('../src/utils/fixedMessage');
const { getWelcomeMessage } = require('../src/utils/welcomeMessage');
assert.equal(getFixedMessage('guild-fixed').content, '固定本文');
assert.equal(getWelcomeMessage('guild-welcome').content, '歓迎本文');

deleteFixedMessage('guild-fixed');
createFixedMessage({
  guildId: 'guild-fixed', channelId: 'channel-fixed-new', messageId: 'message-fixed-new',
  content: '新しい固定本文', userId: 'owner',
});

const legacyCheck = new Database(legacyPath, { readonly: true });
assert.equal(legacyCheck.prepare('SELECT content FROM fixed_messages WHERE guild_id = ?').get('guild-fixed').content, '固定本文');
legacyCheck.close();

const secondReport = migrateDatabase();
assert.equal(secondReport.legacy.fixedMessages.imported, 0, '既存設定を上書きしないこと');
assert.equal(secondReport.legacy.welcomeMessages.imported, 0, '再実行時に重複しないこと');

console.log('✅ Main DB split and legacy configuration migration verified');
