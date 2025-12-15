const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the backend server
// We require it so it runs in the main process
try {
    require('./server/index.js');
} catch (e) {
    console.error("Failed to start server:", e);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true
    });

    // In production, load the built files
    // In development, we might want to load localhost:5173, but for simplicity let's rely on the build
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'client/dist/index.html')}`;

    win.loadURL(startUrl);
}

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
