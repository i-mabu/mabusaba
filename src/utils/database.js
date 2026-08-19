const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.MABUSABA_DATA_DIR || path.join(__dirname, '../data'));
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MODERATION_DB_FILE = 'moderation.db';
const LEGACY_GAME_DB_FILE = 'games.db';
const RETENTION = Math.max(1, Number(process.env.DB_BACKUP_RETENTION || 10));

const MODERATION_REQUIRED = {
  moderation_cases: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT', guild_id: 'TEXT NOT NULL', user_id: 'TEXT NOT NULL',
    user_tag: "TEXT NOT NULL DEFAULT ''", moderator_id: 'TEXT NOT NULL', moderator_tag: "TEXT NOT NULL DEFAULT ''",
    action: 'TEXT NOT NULL', reason: "TEXT NOT NULL DEFAULT '理由なし'", duration: 'INTEGER',
    status: "TEXT NOT NULL DEFAULT 'active'", channel_id: 'TEXT', message_id: 'TEXT',
    created_at: 'INTEGER NOT NULL DEFAULT (unixepoch())', expires_at: 'INTEGER', closed_at: 'INTEGER', metadata: 'TEXT',
  },
  case_notes: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT', case_id: 'INTEGER NOT NULL', author_id: 'TEXT NOT NULL',
    author_tag: "TEXT NOT NULL DEFAULT ''", content: 'TEXT NOT NULL', created_at: 'INTEGER NOT NULL DEFAULT (unixepoch())',
  },
  audit_logs: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT', guild_id: 'TEXT NOT NULL', type: 'TEXT NOT NULL', action: 'TEXT NOT NULL',
    actor_id: 'TEXT', actor_tag: 'TEXT', target_id: 'TEXT', target_tag: 'TEXT', case_id: 'INTEGER', channel_id: 'TEXT',
    message_id: 'TEXT', reason: 'TEXT', data: 'TEXT', created_at: 'INTEGER NOT NULL DEFAULT (unixepoch())',
  },
};

const CONFIG_REQUIRED = {
  fixed_messages: {
    guild_id: 'TEXT PRIMARY KEY', channel_id: 'TEXT NOT NULL', message_id: 'TEXT NOT NULL',
    content: "TEXT NOT NULL DEFAULT ''", embed_title: 'TEXT', embed_description: 'TEXT', embed_color: 'TEXT',
    embed_data: 'TEXT', created_by: 'TEXT NOT NULL', updated_by: 'TEXT NOT NULL',
    created_at: 'INTEGER NOT NULL DEFAULT (unixepoch())', updated_at: 'INTEGER NOT NULL DEFAULT (unixepoch())',
  },
  welcome_messages: {
    guild_id: 'TEXT PRIMARY KEY', channel_id: 'TEXT NOT NULL', content: "TEXT NOT NULL DEFAULT ''",
    embed_title: 'TEXT', embed_description: 'TEXT', embed_color: 'TEXT', embed_data: 'TEXT',
    created_by: 'TEXT NOT NULL', updated_by: 'TEXT NOT NULL',
    created_at: 'INTEGER NOT NULL DEFAULT (unixepoch())', updated_at: 'INTEGER NOT NULL DEFAULT (unixepoch())',
  },
};

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function tableExists(db, table) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
}

function columns(db, table) {
  if (!tableExists(db, table)) return new Set();
  return new Set(db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all().map(column => column.name));
}

function createTable(db, table, schema) {
  const definitions = Object.entries(schema).map(([name, type]) => `${quoteIdentifier(name)} ${type}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${quoteIdentifier(table)} (${definitions.join(', ')})`);
}

function addMissingColumns(db, table, schema) {
  if (!tableExists(db, table)) {
    createTable(db, table, schema);
    return { created: true, added: [] };
  }

  const existing = columns(db, table);
  const added = [];
  for (const [name, type] of Object.entries(schema)) {
    if (existing.has(name)) continue;
    if (/PRIMARY KEY|AUTOINCREMENT/i.test(type)) {
      throw new Error(`既存テーブル ${table} に必須キー列 ${name} がありません。自動変換できないため停止しました。`);
    }
    db.exec(`ALTER TABLE ${quoteIdentifier(table)} ADD COLUMN ${quoteIdentifier(name)} ${type}`);
    added.push(name);
  }
  return { created: false, added };
}

function ensureMainSchema(db) {
  const changes = {};
  for (const [table, schema] of Object.entries(MODERATION_REQUIRED)) {
    changes[table] = addMissingColumns(db, table, schema);
  }
  for (const [table, schema] of Object.entries(CONFIG_REQUIRED)) {
    changes[table] = addMissingColumns(db, table, schema);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cases_guild_user ON moderation_cases(guild_id, user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cases_guild_action ON moderation_cases(guild_id, action, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON moderation_cases(guild_id, status);
    CREATE INDEX IF NOT EXISTS idx_case_notes_case ON case_notes(case_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_audit_guild_time ON audit_logs(guild_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_guild_type ON audit_logs(guild_id, type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(guild_id, target_id, created_at DESC);
  `);
  return changes;
}

function backupDatabase(filePath, timestamp) {
  if (!fs.existsSync(filePath)) return null;

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const name = path.basename(filePath, '.db');
  const dir = path.join(BACKUP_DIR, timestamp);
  fs.mkdirSync(dir, { recursive: true });

  let checkpointed = false;
  try {
    const db = new Database(filePath);
    try {
      db.pragma('busy_timeout = 5000');
      db.pragma('wal_checkpoint(TRUNCATE)');
      checkpointed = true;
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn(`⚠️ ${path.basename(filePath)} のWALチェックポイントに失敗。関連ファイルをそのままバックアップします: ${error.message}`);
  }

  const destination = path.join(dir, `${name}.db`);
  fs.copyFileSync(filePath, destination);
  if (!checkpointed) {
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = `${filePath}${suffix}`;
      if (fs.existsSync(sidecar)) fs.copyFileSync(sidecar, `${destination}${suffix}`);
    }
  }
  return destination;
}

function backupExistingDatabases(timestamp) {
  return [MODERATION_DB_FILE, LEGACY_GAME_DB_FILE]
    .map(file => backupDatabase(path.join(DATA_DIR, file), timestamp))
    .filter(Boolean);
}

function pruneBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const dirs = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .reverse();
  for (const dir of dirs.slice(RETENTION)) {
    fs.rmSync(path.join(BACKUP_DIR, dir), { recursive: true, force: true });
  }
}

function integrityCheck(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false, ok: true, result: 'new database' };
  const db = new Database(filePath, { readonly: true });
  try {
    const result = db.pragma('integrity_check', { simple: true });
    return { exists: true, ok: result === 'ok', result };
  } finally {
    db.close();
  }
}

function tableRowCount(db, table) {
  if (!tableExists(db, table)) return null;
  return db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get().count;
}

function snapshotCounts(db, tables) {
  return Object.fromEntries(tables.map(table => [table, tableRowCount(db, table)]));
}

function verifyCountsUnchanged(before, after, file) {
  for (const [table, count] of Object.entries(before)) {
    if (count !== null && after[table] !== count) {
      throw new Error(`互換性チェック失敗: ${file} の ${table} 件数が ${count} → ${after[table]} に変化しました。`);
    }
  }
}

function migrateLegacyConfiguration(targetDb) {
  const legacyPath = path.join(DATA_DIR, LEGACY_GAME_DB_FILE);
  const result = {
    source: legacyPath,
    fixedMessages: { found: 0, imported: 0, alreadyPresent: 0 },
    welcomeMessages: { found: 0, imported: 0, alreadyPresent: 0 },
  };
  if (!fs.existsSync(legacyPath)) return result;

  const legacyDb = new Database(legacyPath, { readonly: true });
  try {
    if (tableExists(legacyDb, 'fixed_messages')) {
      const rows = legacyDb.prepare('SELECT * FROM fixed_messages').all();
      const insert = targetDb.prepare(`
        INSERT OR IGNORE INTO fixed_messages
        (guild_id, channel_id, message_id, content, embed_title, embed_description, embed_color, embed_data, created_by, updated_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rows) {
        const info = insert.run(
          row.guild_id, row.channel_id, row.message_id, row.content ?? '', row.embed_title ?? null,
          row.embed_description ?? null, row.embed_color ?? null, row.embed_data ?? null,
          row.created_by ?? 'legacy', row.updated_by ?? row.created_by ?? 'legacy',
          row.created_at ?? Math.floor(Date.now() / 1000), row.updated_at ?? row.created_at ?? Math.floor(Date.now() / 1000)
        );
        result.fixedMessages.found += 1;
        if (info.changes) result.fixedMessages.imported += 1;
        else result.fixedMessages.alreadyPresent += 1;
      }
    }

    if (tableExists(legacyDb, 'welcome_messages')) {
      const rows = legacyDb.prepare('SELECT * FROM welcome_messages').all();
      const insert = targetDb.prepare(`
        INSERT OR IGNORE INTO welcome_messages
        (guild_id, channel_id, content, embed_title, embed_description, embed_color, embed_data, created_by, updated_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rows) {
        const info = insert.run(
          row.guild_id, row.channel_id, row.content ?? '', row.embed_title ?? null, row.embed_description ?? null,
          row.embed_color ?? null, row.embed_data ?? null, row.created_by ?? 'legacy', row.updated_by ?? row.created_by ?? 'legacy',
          row.created_at ?? Math.floor(Date.now() / 1000), row.updated_at ?? row.created_at ?? Math.floor(Date.now() / 1000)
        );
        result.welcomeMessages.found += 1;
        if (info.changes) result.welcomeMessages.imported += 1;
        else result.welcomeMessages.alreadyPresent += 1;
      }
    }
  } finally {
    legacyDb.close();
  }
  return result;
}

function migrateDatabase() {
  ensureDir();
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const shouldBackup = String(process.env.DB_BACKUP_ON_START ?? 'true').toLowerCase() !== 'false';
  const backups = shouldBackup ? backupExistingDatabases(timestamp) : [];
  const files = [MODERATION_DB_FILE, LEGACY_GAME_DB_FILE];
  const beforeChecks = files.map(file => ({ file, ...integrityCheck(path.join(DATA_DIR, file)) }));
  const broken = beforeChecks.filter(item => item.exists && !item.ok);
  if (broken.length) {
    throw new Error(`SQLite整合性チェック失敗: ${broken.map(item => `${item.file}=${item.result}`).join(', ')}。バックアップは保存済みです。`);
  }

  const moderationPath = path.join(DATA_DIR, MODERATION_DB_FILE);
  const db = new Database(moderationPath);
  const compatibility = { before: {}, after: {} };
  let migration;
  let legacy;
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.exec('BEGIN');
    const moderationTables = Object.keys(MODERATION_REQUIRED);
    const allTables = [...moderationTables, ...Object.keys(CONFIG_REQUIRED)];
    compatibility.before = snapshotCounts(db, allTables);
    const moderationBefore = snapshotCounts(db, moderationTables);
    migration = ensureMainSchema(db);
    legacy = migrateLegacyConfiguration(db);
    compatibility.after = snapshotCounts(db, allTables);
    verifyCountsUnchanged(moderationBefore, compatibility.after, MODERATION_DB_FILE);
    db.exec(`CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    db.prepare(`INSERT INTO schema_meta(key,value) VALUES('schema_version','3') ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run();
    db.prepare(`INSERT INTO schema_meta(key,value) VALUES('last_migrated_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(new Date().toISOString());
    db.exec('COMMIT');
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    throw error;
  } finally {
    db.close();
  }

  pruneBackups();
  const afterChecks = files.map(file => ({ file, ...integrityCheck(path.join(DATA_DIR, file)) }));
  const failed = afterChecks.filter(item => item.exists && !item.ok);
  if (failed.length) throw new Error(`移行後のSQLite整合性チェック失敗: ${failed.map(item => `${item.file}=${item.result}`).join(', ')}`);

  return { timestamp, backups, beforeChecks, afterChecks, migration, compatibility, legacy, backupDir: BACKUP_DIR };
}

function printReport(report) {
  console.log('🗄️ Main Bot DB移行');
  for (const item of report.beforeChecks) console.log(`  ${item.file}: ${item.exists ? (item.ok ? 'OK' : 'NG') : '未作成'}`);
  if (report.backups.length) console.log(`  💾 バックアップ: ${report.backups.join(', ')}`);
  const changed = Object.entries(report.migration).filter(([, value]) => value.created || value.added?.length);
  console.log(changed.length ? `  🔧 スキーマ更新: ${JSON.stringify(Object.fromEntries(changed))}` : '  ✅ スキーマ互換');
  const { fixedMessages, welcomeMessages } = report.legacy;
  if (fixedMessages.found || welcomeMessages.found) {
    console.log(`  📦 旧設定移行: fixed=${fixedMessages.imported}/${fixedMessages.found}, welcome=${welcomeMessages.imported}/${welcomeMessages.found}`);
  }
  for (const item of report.afterChecks) console.log(`  ${item.file}: ${item.exists ? (item.ok ? '整合性OK' : '整合性NG') : '未作成'}`);
}

if (require.main === module) {
  try {
    printReport(migrateDatabase());
  } catch (error) {
    console.error('❌ DB移行失敗:', error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  DATA_DIR,
  BACKUP_DIR,
  migrateDatabase,
  integrityCheck,
};
