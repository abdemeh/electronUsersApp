const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Important for security
            contextIsolation: true // Required for IPC in renderer process
        }
    });

    mainWindow.loadFile('login.html');
    mainWindow.setMenu(null); // Remove menu bar for cleaner UI
}

ipcMain.handle('check-word', async () => {
    return new Promise((resolve) => {
        exec('reg query "HKLM\\Software\\Microsoft\\Office\\Word" /v Path', (error, stdout) => {
            if (error) {
                resolve({ installed: false });
                return;
            }

            // Extract version info
            const versionMatch = stdout.match(/(\d+(\.\d+)+)/);
            if (versionMatch) {
                resolve({ installed: true, version: versionMatch[0] });
            } else {
                resolve({ installed: true, version: 'Unknown' });
            }
        });
    });
});

ipcMain.on('login', (event, { email, password }) => {
    console.log('Received login request:', email);
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            event.reply('login-response', { success: false, message: 'Erreur de la base de données.' });
            return;
        }

        if (!row) {
            event.reply('login-response', { success: false, message: 'Utilisateur non trouvé.' });
            return;
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                console.error('Password comparison error:', err.message);
                event.reply('login-response', { success: false, message: 'Erreur d\'authentification.' });
                return;
            }

            if (result) {
                // Store user data in mainWindow
                mainWindow.userData = {
                    nom: row.nom,
                    prenom: row.prenom,
                    email: email // Store email separately if needed
                };
                event.reply('login-response', { success: true });
            } else {
                event.reply('login-response', { success: false, message: 'Incorrect password.' });
            }
        });
    });
});

ipcMain.on('signup', (event, { nom, prenom, email, password }) => {
    // Check if the user already exists in the database (pseudo code)
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            event.reply('signup-response', { success: false, message: 'Database error.' });
            return;
        }

        if (row) {
            // User already exists
            event.reply('signup-response', { success: false, message: 'Email already in use.' });
            return;
        }

        // Insert new user into the database (pseudo code)
        db.run('INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)', [nom, prenom, email, password], (err) => {
            if (err) {
                console.error('Error inserting user:', err.message);
                event.reply('signup-response', { success: false, message: 'Failed to create account.' });
                return;
            }

            event.reply('signup-response', { success: true });
        });
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC to retrieve user data for profil.html
ipcMain.handle('get-user-data', (event) => {
    event.returnValue = mainWindow.userData;
});
