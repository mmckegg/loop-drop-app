var h = require('lib/h')
var electron = require('electron')
var Value = require('@mmckegg/mutant/value')
var computed = require('@mmckegg/mutant/computed')

module.exports = function (context) {
  var updateAvailable = UpdateAvailable(context.version)
  return h('ChooseProject', [
    h('section.messages', [
      computed(updateAvailable, function (info) {
        if (info) {
          return h('div.updateAvailable', [
            h('h1', [
              h('strong', 'Update Available'),
              ' - version ' + info.version
            ]),
            h('a', {href: info.url}, 'Download Now'), ' | ',
            h('a', {href: 'https://github.com/mmckegg/loop-drop-app/releases'}, 'View Changelog')
          ])
        }
      })
    ]),
    h('section.main', [
      h('header', [
        h('img', {src: '../logo.png', width: '128'}),
        h('h1', 'Loop Drop'),
        h('h2', 'version ' + context.version)
      ]),
      h('div', [
        h('button -new', {'ev-click': newProject}, 'New Project'),
        h('button', {'ev-click': loadDemoProject}, 'Open Demo Project'),
        h('button', {'ev-click': chooseProject}, 'Browse...')
      ])
    ]),
    h('section.footer', [
      h('p', [
        'visit ', h('a', { href: 'http://loopjs.com' }, 'loopjs.com'), ' for help'
      ])
    ])
  ])
}

function UpdateAvailable (version) {
  var result = Value()
  window.fetch('http://loopjs.com/loop-drop/check-version/' + version).then(r => r.json()).then(function (data) {
    if (data.updateAvailable) {
      result.set(data)
    }
  })
  return result
}

function newProject () {
  electron.ipcRenderer.send('new-project')
}

function chooseProject () {
  electron.ipcRenderer.send('choose-project')
}

function loadDemoProject () {
  electron.ipcRenderer.send('load-demo-project')
}
