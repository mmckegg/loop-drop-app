var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var getBaseName = require('path').basename
var getDirectory = require('path').dirname
var join = require('path').join
var Map = require('@mmckegg/mutant/map')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')

var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')

var renderNode = require('lib/render-node')
var rawEditor = require('./editor/raw.js')

module.exports = TabbedEditor

function TabbedEditor (project) {
  var actions = project.actions

  var tabs = Map(project.items, function (fileObject) {
    return computed([fileObject.path], function (path) {
      var item = fileObject.node
      if (path && item) {
        var selected = computed([project.selected], s => s === path)
        var editor = computed([project.rawMode], function renderTab (rawMode) {
          if (rawMode) {
            return rawEditor(item)
          } else {
            return renderNode(item)
          }
        })
        return h('div.tab', {
          classList: [
            when(selected, '-active')
          ]
        }, editor)
      }
    })
  })

  var controls = h('span.controls', [
    ToggleButton(project.rawMode, {
      title: 'raw'
    }),
    Select(project.zoom, {
      options: [
        ['50%', 0.5],
        ['75%', 0.75],
        ['90%', 0.9],
        ['100%', 1],
        ['110%', 1.1],
        ['125%', 1.25],
        ['150%', 1.5]
      ]
    })
  ])

  var hasTabs = computed([tabs], tabs => !!tabs.length)

  var tabButtons = Map(project.items, function (item) {
    var name = computed(item.path, getName)
    var selected = computed([project.selected, item.path], eq)
    var close = item._type === 'ExternalNode'
      ? send(actions.closeExternal, item)
      : send(item.close)
    return h('div.tab', {
      'ev-click': send(actions.select, item),
      'classList': [
        when(selected, '-selected')
      ]
    }, [
      h('span', [name]),
      h('button.close', {'ev-click': close})
    ])
  })

  return h('TabbedEditor', [
    h('header', [ tabButtons, controls ]),
    when(hasTabs,
      tabs,
      renderHelper()
    )
  ])
}

function getName (path) {
  if (path) {
    var base = getBaseName(path, '.json')
    if (base === 'index') {
      return getBaseName(getDirectory(path))
    } else {
      var dir = getBaseName(getDirectory(path))
      return dir + ' > ' + base
    }
  }
}

function renderHelper () {
  return h('div CenterTab', [
    h('div Helper', [
      h('a', {href: 'http://loopjs.com/'}, [
        h('img', {src: 'file://' + join(__dirname, '..', '..', 'logo.png'), width: 128})
      ]),
      h('br'),
      'For help visit ',
      h('a', {href: 'http://loopjs.com/'}, 'loopjs.com')
    ])
  ])
}

function eq (a, b) {
  return a === b
}
