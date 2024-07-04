const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');
const { exec } = require('child_process');

function createWindow() {
    const mainWindow = new BrowserWindow({
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

ipcMain.on('login', (event, { username, password }) => {
    console.log('Received login request:', username);
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            event.reply('login-response', { success: false, message: 'Database error.' });
            return;
        }

        if (!row) {
            event.reply('login-response', { success: false, message: 'User not found.' });
            return;
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                console.error('Password comparison error:', err.message);
                event.reply('login-response', { success: false, message: 'Authentication error.' });
                return;
            }

            if (result) {
                event.reply('login-response', { success: true });
            } else {
                event.reply('login-response', { success: false, message: 'Incorrect password.' });
            }
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
