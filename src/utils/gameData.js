const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(
  path.join(dataDir, 'games.db')
);

// SQLiteの安全性・性能設定
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT '',
    points INTEGER NOT NULL DEFAULT 100,
    games INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const getUserStmt = db.prepare(`
  SELECT
    user_id,
    username,
    points,
    games,
    wins,
    losses,
    created_at,
    updated_at
  FROM users
  WHERE user_id = ?
`);

const createUserStmt = db.prepare(`
  INSERT INTO users (
    user_id,
    username,
    points
  )
  VALUES (?, ?, 100)
`);

const updateUsernameStmt = db.prepare(`
  UPDATE users
  SET
    username = ?,
    updated_at = unixepoch()
  WHERE user_id = ?
`);

const updatePointsStmt = db.prepare(`
  UPDATE users
  SET
    points = points + ?,
    updated_at = unixepoch()
  WHERE user_id = ?
`);

const recordGameStmt = db.prepare(`
  UPDATE users
  SET
    points = points + ?,
    games = games + 1,
    wins = wins + ?,
    losses = losses + ?,
    updated_at = unixepoch()
  WHERE user_id = ?
`);

const rankingStmt = db.prepare(`
  SELECT
    user_id,
    username,
    points,
    games,
    wins,
    losses
  FROM users
  ORDER BY points DESC, wins DESC
  LIMIT ?
`);

function ensureUser(userId, username = '') {
  let user = getUserStmt.get(userId);

  if (!user) {
    createUserStmt.run(userId, username);
    user = getUserStmt.get(userId);
  } else if (
    username &&
    user.username !== username
  ) {
    updateUsernameStmt.run(username, userId);
    user = getUserStmt.get(userId);
  }

  return user;
}

function getUser(userId, username = '') {
  return ensureUser(userId, username);
}

function addPoints(
  userId,
  amount,
  username = ''
) {
  ensureUser(userId, username);

  updatePointsStmt.run(
    amount,
    userId
  );

  return getUser(userId, username);
}

function recordGame(
  userId,
  result,
  points,
  username = ''
) {
  ensureUser(userId, username);

  const win =
    result === 'win' ? 1 : 0;

  const lose =
    result === 'lose' ? 1 : 0;

  recordGameStmt.run(
    points,
    win,
    lose,
    userId
  );

  return getUser(userId, username);
}

function getRanking(limit = 10) {
  return rankingStmt.all(limit);
}

module.exports = {
  getUser,
  addPoints,
  recordGame,
  getRanking,
};