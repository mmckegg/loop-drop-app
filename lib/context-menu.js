var remote = require('remote')
var Menu = remote.require('menu')
var MenuItem = remote.require('menu-item')
var BrowserWindow = remote.require('browser-window')

var contextEvent = null
var menu = new Menu()
menu.append(new MenuItem({ 
  label: 'Inspect Element', 
  click: function() { 
    console.log(contextEvent)
    BrowserWindow.getFocusedWindow().inspectElement(contextEvent.clientX, contextEvent.clientY)
  } 
}))

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  contextEvent = e
  menu.popup(remote.getCurrentWindow())
}, false);