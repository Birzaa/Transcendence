import Database from 'better-sqlite3';

// Configuration de la DB
const dbPath = process.env.DB_PATH || 'transcendence.db';
const db = new Database(dbPath);


// Table users
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);


// Table games
db.exec(`
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    winner_id INTEGER,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tournament_id INTEGER,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);
`);


export default db;