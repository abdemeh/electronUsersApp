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
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('login.html');
    mainWindow.setMenu(null);
}

ipcMain.handle('check-word', async () => {
    return new Promise((resolve) => {
        exec('reg query "HKLM\\Software\\Microsoft\\Office\\Word" /v Path', (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing reg query:', error);
                resolve({ installed: false });
                return;
            }
            if (stderr) {
                console.error('Stderr output:', stderr);
                resolve({ installed: false });
                return;
            }
            console.log('Stdout:', stdout);

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
    console.log('Demande de connexion reçue:', email);
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Erreur de la base de données:', err.message);
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
                mainWindow.userData = {
                    nom: row.nom,
                    prenom: row.prenom,
                    email: email
                };
                console.log('User data stored in mainWindow:', mainWindow.userData);
                event.reply('login-response', { success: true });
            } else {
                event.reply('login-response', { success: false, message: 'Mot de passe incorrect.' });
            }
        });
    });
});

ipcMain.on('signup', (event, { nom, prenom, email, password }) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            event.reply('signup-response', { success: false, message: 'Erreur de la base de données.' });
            return;
        }

        if (row) {
            event.reply('signup-response', { success: false, message: 'Email déjà utilisé.' });
            return;
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err.message);
                event.reply('signup-response', { success: false, message: 'Erreur lors de la création du compte.' });
                return;
            }

            db.run('INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)', [nom, prenom, email, hashedPassword], (err) => {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    event.reply('signup-response', { success: false, message: 'Échec de la création du compte.' });
                    return;
                }

                event.reply('signup-response', { success: true });
            });
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

ipcMain.handle('get-user-data', async () => {
    console.log('Renvoyer les données utilisateur:', mainWindow.userData);
    return mainWindow.userData;
});

ipcMain.on('save-user-data', (event, userData) => {
    const { nom, prenom, email, password } = userData;
    const currentUser = mainWindow.userData;
    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Erreur:', err.message);
                event.reply('save-user-response', { success: false, message: 'Erreur.' });
                return;
            }

            db.run('UPDATE users SET nom = ?, prenom = ?, email = ?, password = ? WHERE email = ?', [nom, prenom, email, hashedPassword, currentUser.email], (err) => {
                if (err) {
                    console.error('Erreur de la base de données.', err.message);
                    event.reply('save-user-response', { success: false, message: 'Erreur de la base de données.' });
                    return;
                }
                mainWindow.userData = { nom, prenom, email };

                event.reply('save-user-response', { success: true });
            });
        });
    } else {
        db.run('UPDATE users SET nom = ?, prenom = ?, email = ? WHERE email = ?', [nom, prenom, email, currentUser.email], (err) => {
            if (err) {
                console.error('Erreur de la base de données:', err.message);
                event.reply('save-user-response', { success: false, message: 'Erreur de la base de données.' });
                return;
            }
            mainWindow.userData = { nom, prenom, email };

            event.reply('save-user-response', { success: true });
        });
    }
});
