const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataFile = path.join(dataDir, 'games.json');

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
      recursive: true,
    });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify({}, null, 2),
      'utf8'
    );
  }
}

function loadData() {
  ensureDataFile();

  try {
    return JSON.parse(
      fs.readFileSync(dataFile, 'utf8')
    );
  } catch (error) {
    console.error(
      'ゲームデータ読み込みエラー:',
      error
    );

    return {};
  }
}

function saveData(data) {
  ensureDataFile();

  fs.writeFileSync(
    dataFile,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function ensureUser(userId, username = '') {
  const data = loadData();

  if (!data[userId]) {
    data[userId] = {
      username,
      points: 100,
      games: 0,
      wins: 0,
      losses: 0,
    };
  }

  if (username) {
    data[userId].username = username;
  }

  saveData(data);

  return data[userId];
}

function getUser(userId, username = '') {
  return ensureUser(userId, username);
}

function addPoints(userId, amount, username = '') {
  const data = loadData();

  if (!data[userId]) {
    data[userId] = {
      username,
      points: 100,
      games: 0,
      wins: 0,
      losses: 0,
    };
  }

  data[userId].points += amount;

  if (username) {
    data[userId].username = username;
  }

  saveData(data);

  return data[userId];
}

function recordGame(
  userId,
  result,
  points,
  username = ''
) {
  const data = loadData();

  if (!data[userId]) {
    data[userId] = {
      username,
      points: 100,
      games: 0,
      wins: 0,
      losses: 0,
    };
  }

  data[userId].games += 1;
  data[userId].points += points;

  if (result === 'win') {
    data[userId].wins += 1;
  }

  if (result === 'lose') {
    data[userId].losses += 1;
  }

  if (username) {
    data[userId].username = username;
  }

  saveData(data);

  return data[userId];
}

function getRanking(limit = 10) {
  const data = loadData();

  return Object.entries(data)
    .sort(([, a], [, b]) =>
      b.points - a.points
    )
    .slice(0, limit)
    .map(([id, user]) => ({
      id,
      ...user,
    }));
}

module.exports = {
  loadData,
  saveData,
  getUser,
  addPoints,
  recordGame,
  getRanking,
};