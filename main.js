var electron = require('electron')
var defaultMenu = require('electron-default-menu')
var BrowserWindow = electron.BrowserWindow
var fs = require('fs')
var Menu = electron.Menu
var join = require('path').join

var mainWindow = null
var currentProject = null
var loading = false
var storage = require('electron-json-storage')

// expose manual gc()
electron.app.commandLine.appendSwitch('js-flags', '--expose_gc')

var menu = defaultMenu(electron.app, electron.shell)
menu.splice(1, 0, {
  label: 'Project',
  submenu: [
    { label: 'New Project...', click: newProject },
    { label: 'Choose Project...', click: chooseProject },
    { type: 'separator' },
    { label: 'Load Demo Project', click: loadDemoProject }
  ]
})

function newProject () {
  electron.dialog.showSaveDialog({
    title: 'Create New Project',
    buttonLabel: 'Create Project'
  }, function (path) {
    if (path) {
      createProject(path)
    }
  })
}

function chooseProject () {
  electron.dialog.showOpenDialog({
    title: 'Browse for Project Folder',
    buttonLabel: 'Load Project',
    properties: [ 'openDirectory' ]
  }, function (paths) {
    if (paths && paths.length) {
      var path = paths[0]
      if (fs.existsSync(join(path, 'project.json'))) {
        loadProject(path)
      } else if (fs.existsSync(join(path, '..', 'project.json'))) {
        loadProject(join(path, '..'))
      } else {
        electron.dialog.showErrorBox('Cannot Open Project', 'The chosen directory is not a Loop Drop project.')
      }
    }
  })
}

function loadDemoProject () {
  loadProject(getDemoProjectPath())
}

function loadLastProject () {
  storage.get('lastProject', function (err, path) {
    if (err) throw err
    if (typeof path === 'string' && fs.existsSync(path)) {
      loadProject(path)
    } else {
      loadDemoProject()
    }
  })
}

electron.ipcMain.on('new-project', newProject)
electron.ipcMain.on('choose-project', chooseProject)
electron.ipcMain.on('load-demo-project', loadDemoProject)

electron.ipcMain.on('loaded', function (event, arg) {
  event.sender.send('load-project', currentProject)
})

electron.app.on('window-all-closed', function () {
  if (!loading) {
    mainWindow = null
    electron.app.quit()
  }
})

electron.app.on('ready', function () {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
  loadLastProject()
})

function createProject (path) {
  fs.mkdir(path, (err) => {
    if (err) throw err
    fs.writeFile(join(path, 'project.json'), JSON.stringify({
      node: 'project'
    }), (err) => {
      if (err) throw err
      loadProject(path)
    })
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
  loading = true

  storage.set('lastProject', path)
  currentProject = path

  var window = new BrowserWindow({
    width: 1400,
    height: 900,
    title: path + ' — Loop Drop',
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      experimentalFeatures: true,
      pageVisibility: true
    },
    backgroundColor: '#444'
  })

  window.once('ready-to-show', function () {
    window.show()
    loading = false
  })

  window.on('close', function (e) {
    e.preventDefault()
    window.send('close')
  })

  window.webContents.on('will-navigate', function (e) {
    e.preventDefault()
  })

  window.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.loadURL('file://' + __dirname + '/views/window.html')

  if (mainWindow) {
    mainWindow.close()
  }

  mainWindow = window
}
