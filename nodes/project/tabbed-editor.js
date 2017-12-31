var h = require('lib/h')
var send = require('mutant/send')
var getBaseName = require('path').basename
var getDirectory = require('path').dirname
var Map = require('mutant/map')
var computed = require('mutant/computed')
var when = require('mutant/when')

var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')

var renderNode = require('lib/render-node')
var rawEditor = require('./editor/raw.js')
var renderWelcome = require('./welcome')
var mags = ' KMGTPEZY';

module.exports = TabbedEditor

function TabbedEditor (project) {
  var actions = project.actions

  var tabs = Map(project.items, function (fileObject) {
    return computed([fileObject.path], function (path) {
      var nodeName = fileObject.nodeName
      if (path) {
        var selected = computed([project.selected], s => s === path)
        var editor = computed([project.rawMode, nodeName], function renderTab (rawMode, nodeName) {
          if (rawMode) {
            return rawEditor(fileObject.node)
          } else {
            return renderNode(fileObject.node)
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

  var memoryClass = computed(project.context.heapSize, (kb) => {
    if (kb > 150 * 1024) {
      return '-critical'
    } else if (kb > 100 * 1024) {
      return '-warn'
    }
  })

  var controls = h('span.controls', [
    h('MemoryUsage', {classList: memoryClass, tabIndex: 1, 'ev-click': send(actions.purge), title: 'Click to purge'}, [
      computed(project.context.heapSize, (v) => humanSize(v * 1000))
    ]),
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
      'ev-dragenter': send(actions.select, item),
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
      renderWelcome(project.context)
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

function eq (a, b) {
  return a === b
}


function humanSize(bytes, precision) {
  var magnitude = Math.min(Math.log(bytes) / Math.log(1024) | 0, mags.length - 1);
  var result = bytes / Math.pow(1024, magnitude);
  var suffix = mags[magnitude].trim() + 'B';
  return result.toFixed(precision) + ' ' + suffix;
}
