var electron = require('electron')
var Menu = electron.remote.Menu
var MenuItem = electron.remote.MenuItem
var BrowserWindow = electron.remote.BrowserWindow

var contextEvent = null
var menu = new Menu()
menu.append(new MenuItem({
  label: 'Inspect Element',
  click: function() {
    var x = Math.round(contextEvent.clientX * window.rootContext.zoom())
    var y = Math.round(contextEvent.clientY * window.rootContext.zoom())
    BrowserWindow.getFocusedWindow().inspectElement(x, y)
  }
}))

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  contextEvent = e
  menu.popup(electron.remote.getCurrentWindow())
}, false)
