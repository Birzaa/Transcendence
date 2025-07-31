import Database from 'better-sqlite3';

// Configuration de la DB
const dbPath = process.env.DB_PATH || 'transcendence.db';
const db = new Database(dbPath);

// Activer les foreign keys
db.pragma('foreign_keys = ON');

// Table users
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '/avatar/default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

type TableInfoColumn = { name: string };

const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as TableInfoColumn[];
const hasTwoFASecret = userColumns.some(col => col.name === 'twofa_secret');

if (!hasTwoFASecret) {
  db.exec(`ALTER TABLE users ADD COLUMN twofa_secret TEXT`);
}

// Table games
db.exec(`
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER,
    player2_id INTEGER,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    winner_id INTEGER,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);
`);


// Table friends corrigée avec CREATE TABLE et FOREIGN KEY
db.exec(`
CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

export default db;
