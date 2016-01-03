var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')
var getBaseName = require('path').basename
var getDirectory = require('path').dirname
var join = require('path').join

var ValueEvent = require('lib/value-event')
var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')

var renderEditor = require('./editor')
var rawEditor = require('./editor/raw.js')

module.exports = TabbedEditor

function TabbedEditor(project){
  var data = project()
  var fileObject = getItem(project)

  var tabs = project.items._list.map(function (item) {
    var tab = (data.rawMode && item)
      ? rawEditor(item)
      : renderEditor(item)
    return h('div.tab', {
      key: item.path,
      className: fileObject === item ? '-active' : ''
    }, tab)
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

  return h('TabbedEditor', [
    h('header', [project.items._list.map(renderTab, project), controls]),
    tabs.length ? tabs : renderHelper()
  ])
}

function renderTab(item){
  var project = this
  var actions = project.actions

  var data = item&&item()
  if (data){
    var selected = project.selected() == item.path
    return h('div.tab', {
      'ev-click': send(project.selected.set, item.path),
      'className': selected ? '-selected' : null
    }, [
      h('span', [getName(item.path)]),
      h('button.close', {'ev-click': send(actions.closeFile, item.path)})
    ])
  } else {
    return ''
  }
}

function getName(path){
  var base = getBaseName(path, '.json')
  if (base === 'index'){
    return getBaseName(getDirectory(path))
  } else {
    var dir = getBaseName(getDirectory(path))
    return dir + ' > ' + base
  }
}

function renderHelper(){
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

function getItem(state){
  var result = null
  var path = state.selected()
  state.items.some(function(item){
    if (item.path === path){
      result = item
      return true
    }
  })
  return result
}
