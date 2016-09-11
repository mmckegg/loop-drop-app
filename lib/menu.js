var electron = require('electron')
var defaultMenu = require('electron-default-menu')

var menu = defaultMenu(electron.app, electron.shell)
menu.splice(1, 0, {
  label: 'Project',
  submenu: [
    {
      label: 'New Project...',
      click: (item, focusedWindow) => {
        electron.dialog.showMessageBox({ message: 'Do something', buttons: ['OK'] })
      }
    }
  ]
})
module.exports = menu
