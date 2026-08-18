const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {
    recursive: true
  });
}

const db = new Database(
  path.join(dataDir, 'games.db')
);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

/*
 * ==================================================
 * テーブル作成
 * ==================================================
 *
 * content は既存DBとの互換性のため
 * NOT NULLでも空文字を入れる。
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS fixed_messages (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,

    content TEXT NOT NULL DEFAULT '',

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
 * ==================================================
 * Migration
 * ==================================================
 */

function getColumns(table) {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all();
}

function ensureColumn(
  table,
  column,
  definition
) {
  const columns = getColumns(table);

  const exists = columns.some(
    item => item.name === column
  );

  if (!exists) {
    db.exec(`
      ALTER TABLE ${table}
      ADD COLUMN ${column} ${definition}
    `);
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

/*
 * ==================================================
 * SELECT
 * ==================================================
 */

const getStmt = db.prepare(`
  SELECT *
  FROM fixed_messages
  WHERE guild_id = ?
`);

/*
 * ==================================================
 * INSERT
 * ==================================================
 */

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

/*
 * ==================================================
 * UPDATE
 * ==================================================
 */

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

/*
 * ==================================================
 * DELETE
 * ==================================================
 */

const deleteStmt = db.prepare(`
  DELETE FROM fixed_messages
  WHERE guild_id = ?
`);

/*
 * ==================================================
 * GET
 * ==================================================
 */

function getFixedMessage(guildId) {
  return getStmt.get(guildId) || null;
}

/*
 * ==================================================
 * CREATE
 * ==================================================
 */

function createFixedMessage({
  guildId,
  channelId,
  messageId,
  content = '',
  embed = null,
  userId
}) {
  const existing =
    getFixedMessage(guildId);

  if (existing) {
    throw new Error(
      'このサーバーには既に固定メッセージがあります。'
    );
  }

  /*
   * NULL禁止対策
   *
   * null / undefined を必ず空文字にする
   */
  const safeContent =
    content == null
      ? ''
      : String(content);

  const embedTitle =
    embed?.title ?? null;

  const embedDescription =
    embed?.description ?? null;

  const embedColor =
    embed?.color != null
      ? String(embed.color)
      : null;

  const embedData =
    embed != null
      ? JSON.stringify(embed)
      : null;

  insertStmt.run(
    guildId,
    channelId,
    messageId,

    /*
     * NOT NULL
     */
    safeContent,

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
 * ==================================================
 * UPDATE
 * ==================================================
 */

function updateFixedMessage({
  guildId,
  channelId,
  messageId,
  content = '',
  embed = null,
  userId
}) {
  const existing =
    getFixedMessage(guildId);

  if (!existing) {
    throw new Error(
      '固定メッセージが登録されていません。'
    );
  }

  /*
   * NULL禁止対策
   */
  const safeContent =
    content == null
      ? ''
      : String(content);

  const embedTitle =
    embed?.title ?? null;

  const embedDescription =
    embed?.description ?? null;

  const embedColor =
    embed?.color != null
      ? String(embed.color)
      : null;

  const embedData =
    embed != null
      ? JSON.stringify(embed)
      : null;

  updateStmt.run(
    channelId,
    messageId,

    /*
     * NOT NULL
     */
    safeContent,

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
 * ==================================================
 * DELETE
 * ==================================================
 */

function deleteFixedMessage(guildId) {
  deleteStmt.run(guildId);
}

/*
 * ==================================================
 * EMBED取得
 * ==================================================
 */

function getStoredEmbed(fixed) {
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
  } catch (error) {
    console.error(
      '❌ embed_data parse error:',
      error
    );

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