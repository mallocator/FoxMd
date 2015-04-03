var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

/**
 * TODO
 * Options:
 *  * Focused mode (Bottom Third, Center, Off)
 *  * Highlight mode (Line, 3 Lines, Paragraph, Off)
 *  * Configure font / styles
 *  * Save to fs, dropbox, gdrive, email
 *  * Tree structure view
 *  * Statistics view
 *
 */

app.on('ready', function() {
  var Screen = require('screen');
  var size = Screen.getPrimaryDisplay().size;

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height - 50,
    fullscreen: true,
    'frame': false,
    'kiosk': true,
    resizable: false,
    'auto-hide-menu-bar': true
  });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
    process.exit();
  });
});