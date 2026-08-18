const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(
  __dirname,
  '../data'
);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {
    recursive: true
  });
}

const db = new Database(
  path.join(
    dataDir,
    'games.db'
  )
);

db.pragma(
  'journal_mode = WAL'
);

db.pragma(
  'busy_timeout = 5000'
);

db.exec(`
  CREATE TABLE IF NOT EXISTS fixed_messages (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS
    idx_fixed_messages_channel
    ON fixed_messages(channel_id);
`);

const getStmt = db.prepare(`
  SELECT *
  FROM fixed_messages
  WHERE guild_id = ?
`);

const insertStmt = db.prepare(`
  INSERT INTO fixed_messages (
    guild_id,
    channel_id,
    message_id,
    content,
    created_by,
    updated_by
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateStmt = db.prepare(`
  UPDATE fixed_messages
  SET
    channel_id = ?,
    message_id = ?,
    content = ?,
    updated_by = ?,
    updated_at = unixepoch()
  WHERE guild_id = ?
`);

const deleteStmt = db.prepare(`
  DELETE FROM fixed_messages
  WHERE guild_id = ?
`);

function getFixedMessage(guildId) {
  return getStmt.get(guildId) || null;
}

function createFixedMessage({
  guildId,
  channelId,
  messageId,
  content,
  userId
}) {
  const existing =
    getFixedMessage(guildId);

  if (existing) {
    throw new Error(
      'このサーバーには既に固定メッセージがあります。'
    );
  }

  insertStmt.run(
    guildId,
    channelId,
    messageId,
    content,
    userId,
    userId
  );

  return getFixedMessage(
    guildId
  );
}

function updateFixedMessage({
  guildId,
  channelId,
  messageId,
  content,
  userId
}) {
  const existing =
    getFixedMessage(guildId);

  if (!existing) {
    throw new Error(
      '固定メッセージが登録されていません。'
    );
  }

  updateStmt.run(
    channelId,
    messageId,
    content,
    userId,
    guildId
  );

  return getFixedMessage(
    guildId
  );
}

function deleteFixedMessage(
  guildId
) {
  deleteStmt.run(guildId);
}

module.exports = {
  getFixedMessage,
  createFixedMessage,
  updateFixedMessage,
  deleteFixedMessage
};