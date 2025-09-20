const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Register the 'app' scheme as privileged (required for custom protocols)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

let backendProcess;

function createWindow() {
  try {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, // Allow loading local files
      },
    });

    // Load the built frontend. Use app:// for packaged app so absolute /static/... URLs resolve
    if (process.env.NODE_ENV === 'production' || !process.execPath.includes('electron')) {
      // Packaged app: load via custom protocol
      console.log('Loading frontend via app://index.html');
      win.loadURL('app://index.html');
    } else {
      // Development: temporarily use loadFile to test
      const frontendPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
      console.log('Loading frontend from (dev):', frontendPath);
      win.loadFile(frontendPath);
    }

    // Add error handling for page loading
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load page:', errorCode, errorDescription, validatedURL);
    });

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log('Page console:', message, 'from', sourceId, 'line', line);
      try {
        const logPath = path.join(app.getPath('userData'), 'renderer.log');
        fs.appendFileSync(logPath, `[console:${level}] ${sourceId}:${line} - ${message}\n`);
      } catch (err) {
        // ignore logging errors
      }
    });

    win.webContents.on('dom-ready', () => {
      console.log('DOM is ready');
    });

    // Handle window closed
    win.on('closed', () => {
      // Clean up if needed
    });
  } catch (error) {
    console.error('Failed to create window:', error);
  }
}

function startBackend() {
  try {
    // In packaged app, files are in ASAR archive
    let backendPath;
    if (process.env.NODE_ENV === 'production' || !process.execPath.includes('electron')) {
      // For ASAR packaged app, we need to handle the path differently
      const appPath = process.resourcesPath;
      backendPath = path.join(appPath, 'app', 'backend', 'server.js');
    } else {
      backendPath = path.join(__dirname, 'backend/server.js');
    }

    console.log('Starting backend from:', backendPath);

    // In packaged app, use child_process.fork which works better
    if (process.env.NODE_ENV === 'production' || !process.execPath.includes('electron')) {
      // Packaged app - use fork
      backendProcess = require('child_process').fork(backendPath, [], {
        cwd: path.dirname(backendPath),
        stdio: 'inherit',
      });
    } else {
      // Development - use spawn with node
      backendProcess = require('child_process').spawn('node', [backendPath], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
      });
    }

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code}, signal ${signal}`);
    });
  } catch (error) {
    console.error('Error starting backend:', error);
  }
}

app.whenReady().then(() => {

  // Register custom 'app' protocol to serve static files when index.html uses app:// URLs
  try {
    protocol.handle('app', (request) => {
      try {
        let url = request.url.replace(/^app:\/\//, '');
        // Remove any leading slashes or './' so path.join doesn't treat it as absolute
        url = url.replace(/^\/+/, '');
        url = url.replace(/^\.\/*/, '');
        // Handle the root case: 'index.html/' or 'index.html' should load 'index.html'
        if (url === 'index.html/' || url === 'index.html') {
          url = 'index.html';
        } else if (url.startsWith('index.html/')) {
          // For assets: remove 'index.html/' prefix
          url = url.replace('index.html/', '');
        }
        let basePath;
        if (process.env.NODE_ENV === 'production' || !process.execPath.includes('electron')) {
          // Packaged: resources/app/frontend/build
          basePath = path.join(process.resourcesPath, 'app', 'frontend', 'build');
        } else {
          // Dev: Go up one level from Desktop to soono_app, then to frontend/build
          basePath = path.join(__dirname, '..', 'frontend', 'build');
        }
        const fsPath = path.join(basePath, url);
        console.log('Protocol resolving', request.url, '->', fsPath);
        try {
          const logPath = path.join(app.getPath('userData'), 'protocol.log');
          fs.appendFileSync(logPath, `${new Date().toISOString()} RESOLVE ${request.url} -> ${fsPath}\n`);
        } catch (e) {}
        // Check if the file exists before serving
        if (!fs.existsSync(fsPath)) {
          console.error('File does not exist:', fsPath);
          return new Response(null, { status: 404, statusText: 'File not found' });
        } else {
            const content = fs.readFileSync(fsPath);
            const contentType = getContentType(fsPath); // Helper function for MIME type
            return new Response(content, { headers: { 'content-type': contentType } });
        }
      } catch (err) {
        console.error('Error in app protocol handler:', err);
        return new Response(null, { status: 500, statusText: 'Internal server error' });
      }
    });
  } catch (err) {
    console.error('Failed to register app protocol:', err);
  }
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (process.platform === 'darwin' && BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
