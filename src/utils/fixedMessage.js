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

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS fixed_messages (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,

    content TEXT,

    embed_title TEXT,
    embed_description TEXT,
    embed_color TEXT,
    embed_data TEXT,

    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,

    created_at INTEGER NOT NULL
      DEFAULT (unixepoch()),

    updated_at INTEGER NOT NULL
      DEFAULT (unixepoch())
  );
`);

/*
 * ==========================
 * Migration
 * ==========================
 *
 * 既存DBに新しいカラムがない場合に追加。
 */
function ensureColumn(
  table,
  column,
  definition
) {
  const columns =
    db.prepare(
      `PRAGMA table_info(${table})`
    ).all();

  const exists =
    columns.some(
      item =>
        item.name === column
    );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${table}
       ADD COLUMN ${column} ${definition}`
    );
  }
}

ensureColumn(
  'fixed_messages',
  'embed_title',
  'TEXT'
);

ensureColumn(
  'fixed_messages',
  'embed_description',
  'TEXT'
);

ensureColumn(
  'fixed_messages',
  'embed_color',
  'TEXT'
);

ensureColumn(
  'fixed_messages',
  'embed_data',
  'TEXT'
);

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
    embed_title,
    embed_description,
    embed_color,
    embed_data,
    created_by,
    updated_by
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateStmt = db.prepare(`
  UPDATE fixed_messages
  SET
    channel_id = ?,
    message_id = ?,
    content = ?,
    embed_title = ?,
    embed_description = ?,
    embed_color = ?,
    embed_data = ?,
    updated_by = ?,
    updated_at = unixepoch()
  WHERE guild_id = ?
`);

const deleteStmt = db.prepare(`
  DELETE FROM fixed_messages
  WHERE guild_id = ?
`);

/*
 * ==========================
 * Get
 * ==========================
 */
function getFixedMessage(
  guildId
) {
  return (
    getStmt.get(
      guildId
    ) || null
  );
}

/*
 * ==========================
 * Create
 * ==========================
 */
function createFixedMessage({
  guildId,
  channelId,
  messageId,
  content = null,
  embed = null,
  userId
}) {
  const existing =
    getFixedMessage(
      guildId
    );

  if (existing) {
    throw new Error(
      'このサーバーには既に固定メッセージがあります。'
    );
  }

  const embedTitle =
    embed?.title || null;

  const embedDescription =
    embed?.description || null;

  const embedColor =
    embed?.color || null;

  const embedData =
    embed
      ? JSON.stringify(embed)
      : null;

  insertStmt.run(
    guildId,
    channelId,
    messageId,
    content,
    embedTitle,
    embedDescription,
    embedColor,
    embedData,
    userId,
    userId
  );

  return getFixedMessage(
    guildId
  );
}

/*
 * ==========================
 * Update
 * ==========================
 */
function updateFixedMessage({
  guildId,
  channelId,
  messageId,
  content = null,
  embed = null,
  userId
}) {
  const existing =
    getFixedMessage(
      guildId
    );

  if (!existing) {
    throw new Error(
      '固定メッセージが登録されていません。'
    );
  }

  const embedTitle =
    embed?.title || null;

  const embedDescription =
    embed?.description || null;

  const embedColor =
    embed?.color || null;

  const embedData =
    embed
      ? JSON.stringify(embed)
      : null;

  updateStmt.run(
    channelId,
    messageId,
    content,
    embedTitle,
    embedDescription,
    embedColor,
    embedData,
    userId,
    guildId
  );

  return getFixedMessage(
    guildId
  );
}

/*
 * ==========================
 * Delete
 * ==========================
 */
function deleteFixedMessage(
  guildId
) {
  deleteStmt.run(
    guildId
  );
}

/*
 * ==========================
 * Embed取得
 * ==========================
 */
function getStoredEmbed(
  fixed
) {
  if (
    !fixed ||
    !fixed.embed_data
  ) {
    return null;
  }

  try {
    return JSON.parse(
      fixed.embed_data
    );
  } catch {
    return null;
  }
}

module.exports = {
  getFixedMessage,
  createFixedMessage,
  updateFixedMessage,
  deleteFixedMessage,
  getStoredEmbed
};