var app = require('app')
var BrowserWindow = require('browser-window')
var dialog = require('dialog')
var ipc = require('ipc')
var fs = require('fs')
var Shell = require('shell')
var Menu = require('menu')
var menu = Menu.buildFromTemplate(require('lib/menu'))
var join = require('path').join

var welcomeWindow = null
var mainWindow = null
var currentProject = null
var quiting = false

app.on('before-quit', function() {
  quiting = true
})

ipc.on('choose-project', function(event, arg) {
  if (arg === 'new') {
    dialog.showSaveDialog({
      title: 'Create New Project'
    }, function(path){
      if (path) {
        createProject(path)
      }
    })
  } else if (arg === 'demo') {
    loadProject(getDemoProjectPath())
  } else if (arg === 'browse') {
    dialog.showOpenDialog({ 
      title: 'Browse for Project Folder',
      properties: [ 'openDirectory' ]
    }, function(paths) {
      if (paths && paths.length) {
        loadProject(paths[0])
      }
    })
  } else {
    chooseProject()
  }
})

ipc.on('loaded', function(event, arg) {
  event.sender.send('load-project', currentProject)
})

app.on('window-all-closed', function() {
  //if (process.platform != 'darwin')
  app.quit()
})

app.on('ready', function() {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu)
  }
  chooseProject()
});

function chooseProject() {

  if (mainWindow) {
    mainWindow.close()
  }

  if (welcomeWindow) {
    welcomeWindow.close()
  }


  welcomeWindow = new BrowserWindow({
    title: 'Choose Project',
    'accept-first-mouse': true,
    width: 500, 
    height: 550,
    show: false
  })

  welcomeWindow.webContents.on('did-finish-load', function() {
    welcomeWindow.show()
  })

  welcomeWindow.webContents.on('will-navigate', function(e, url) {
    e.preventDefault()
    Shell.openExternal(url)
  })

  welcomeWindow.loadUrl('file://' + __dirname + '/views/welcome.html')

  welcomeWindow.on('closed', function() {
    welcomeWindow = null
  })
}

function createProject(path) {
  fs.mkdir(path, function(err) {
    if (err) throw err
    loadProject(path)
  })
}

function getDemoProjectPath() {
  // find demo-project by looking upwards
  var searchLevels = 2
  var lookUp = []
  for (var i=0;i<searchLevels;i++) {
    lookUp.push('..')
    var current = join.apply(this, [__dirname].concat(lookUp, 'demo-project'))
    if (fs.existsSync(current)) {
      return current
    }
  }

  // fallback
  return join(__dirname, 'demo-project')
}

function loadProject(path) {

  if (mainWindow) {
    mainWindow.close()
  }

  if (welcomeWindow) {
    welcomeWindow.close()
  }

  currentProject = path

  mainWindow = new BrowserWindow({
    width: 1400, 
    height: 900,
    title: path + ' — Loop Drop',
    'accept-first-mouse': true,
    show: false
  })

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show()
  })

  mainWindow.webContents.on('will-navigate', function(e) {
    e.preventDefault()
  })

  mainWindow.webContents.on('will-navigate', function(e, url) {
    e.preventDefault()
    Shell.openExternal(url)
  })

  mainWindow.loadUrl('file://' + __dirname + '/views/window.html')
  mainWindow.on('closed', function() {
    mainWindow = null
    if (!quiting) {
      chooseProject()
    }
  })
}