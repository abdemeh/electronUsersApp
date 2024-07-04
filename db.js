// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'electronApp.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createUsersTable();
    }
});

function createUsersTable() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created or already exists.');
            // Insert initial user (for testing purposes)
            const username = 'admin';
            const password = 'admin123';
            const hashedPassword = bcrypt.hashSync(password, 10);

            db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
                if (err) {
                    console.error('Error inserting initial user:', err.message);
                } else {
                    console.log('Initial user inserted into the users table.');
                }
            });
        }
    });
}

module.exports = db;
