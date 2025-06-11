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

export default db;