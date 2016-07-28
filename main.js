var electron = require('electron')
var BrowserWindow = electron.BrowserWindow
var fs = require('fs')
var Menu = electron.Menu
var menu = Menu.buildFromTemplate(require('lib/menu'))
var join = require('path').join

var welcomeWindow = null
var mainWindow = null
var currentProject = null
var quiting = false

// expose manual gc()
electron.app.commandLine.appendSwitch('js-flags', '--expose_gc')

electron.app.on('before-quit', function () {
  quiting = true
})

electron.ipcMain.on('choose-project', function (event, arg) {
  if (arg === 'new') {
    electron.dialog.showSaveDialog({
      title: 'Create New Project'
    }, function (path) {
      if (path) {
        createProject(path)
      }
    })
  } else if (arg === 'demo') {
    loadProject(getDemoProjectPath())
  } else if (arg === 'browse') {
    electron.dialog.showOpenDialog({
      title: 'Browse for Project Folder',
      properties: [ 'openDirectory' ]
    }, function (paths) {
      if (paths && paths.length) {
        loadProject(paths[0])
      }
    })
  } else {
    chooseProject()
  }
})

electron.ipcMain.on('loaded', function (event, arg) {
  event.sender.send('load-project', currentProject)
})

electron.app.on('window-all-closed', function () {
  electron.app.quit()
})

electron.app.on('ready', function () {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu)
  }
  chooseProject()
})

function chooseProject () {
  if (mainWindow) {
    mainWindow.close()
  }

  if (welcomeWindow) {
    welcomeWindow.show()
  } else {
    welcomeWindow = new BrowserWindow({
      title: 'Choose Project',
      acceptFirstMouse: true,
      width: 500,
      height: 550,
      show: false
    })

    welcomeWindow.webContents.on('did-finish-load', function () {
      welcomeWindow.show()
    })

    welcomeWindow.webContents.on('will-navigate', function (e, url) {
      e.preventDefault()
      electron.shell.openExternal(url)
    })

    welcomeWindow.loadURL('file://' + __dirname + '/views/welcome.html')

    welcomeWindow.on('closed', function () {
      welcomeWindow = null
    })
  }
}

function createProject (path) {
  fs.mkdir(path, function (err) {
    if (err) throw err
    loadProject(path)
  })
}

function getDemoProjectPath () {
  // find demo-project by looking upwards
  var searchLevels = 2
  var lookUp = []
  for (var i = 0; i < searchLevels; i++) {
    lookUp.push('..')
    var current = join.apply(this, [__dirname].concat(lookUp, 'demo-project'))
    if (fs.existsSync(current)) {
      return current
    }
  }

  // fallback
  return join(__dirname, 'demo-project')
}

function loadProject (path) {
  if (mainWindow) {
    mainWindow.close()
  }

  if (welcomeWindow) {
    welcomeWindow.hide()
  }

  currentProject = path

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: path + ' — Loop Drop',
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      experimentalFeatures: true,
      pageVisibility: true
    }
  })

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.show()
  })

  mainWindow.webContents.on('will-navigate', function (e) {
    e.preventDefault()
  })

  mainWindow.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  mainWindow.loadURL('file://' + __dirname + '/views/window.html')
  mainWindow.on('close', function () {
    mainWindow = null
    if (!quiting) {
      chooseProject()
    }
  })
}
