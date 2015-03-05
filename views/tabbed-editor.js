var mercury = require("mercury")
var h = require('micro-css/h')(mercury.h)
var getBaseName = require('path').basename
var getDirectory = require('path').dirname

var change = require('./editor/params/value-event.js')

var renderEditor = require('./editor')
var rawEditor = require('./editor/raw.js')

module.exports = TabbedEditor

function TabbedEditor(state, actions){

  return function(){
    var data = state()
    var fileObject = getItem(state)

    var editor = (data.rawMode && fileObject) ?
      rawEditor(fileObject) :
      fileObject ? 
        renderEditor(fileObject) :
        renderHelper()

    var rawCheckbox = h('span.raw', [
      'raw', h('input.raw', {
        'type': 'checkbox', 
        'checked': state.rawMode(),
        'ev-change': change(state.rawMode.set, 'checked')
      })
    ]) 

    return h('TabbedEditor', [
      h('header', [state.items._list.map(renderTab), rawCheckbox]),
      editor
    ])
  }

  function renderTab(item){
    //if (entry.type === 'directory'){
    //  var entries = entry.entries || []
    //  return h('div.BrowserDirectory', [
    //    h('span', {className: '.title'}, entry.fileName),
    //    h('div', {className: '.sub'}, entries.map(renderEntry.bind(root)))
    //  ])
    //} else {

    var data = item&&item()
    if (data){
      var pre = data.node === 'setup' ? h('strong', 'Setup:') : ''
      var selected = state.selected() == item.path
      return h('div.tab', { 
        'ev-click': mercury.event(state.selected.set, item.path),
        'className': selected ? '-selected' : null
      }, [
        h('span', [pre, ' ', getName(item.path)]), 
        h('button.close', {'ev-click': mercury.event(actions.closeFile, item.path)})
      ])
    } else {
      return ''
    }

  }

}

function getName(path){
  var base = getBaseName(path, '.json')
  if (base === 'index'){
    return getBaseName(getDirectory(path))
  } else {
    return base
  }
}

function renderHelper(){
  return h('div CenterTab', 
    h('div Helper', [
      'For help, view the ',
      h('a', {href: 'https://github.com/mmckegg/loop-drop-app#getting-started', target: '_blank'}, 'getting started guide'),
      ' or ',
      h('br'),
      h('a', {href: 'https://github.com/mmckegg/loop-drop-app/issues', target: '_blank'}, 'ask a question'),
      ' on github.'
    ])
  )
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