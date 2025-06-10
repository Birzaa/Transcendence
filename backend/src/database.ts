import Database from 'better-sqlite3';

// Configuration de la DB
const db = new Database('transcendence.db');

// Création des tables (exemple)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

export default db;