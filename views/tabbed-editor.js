var mercury = require("mercury")
var h = require('micro-css/h')(mercury.h)
var getBaseName = require('path').basename
var getDirectory = require('path').dirname
var join = require('path').join

var ValueEvent = require('lib/value-event')
var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')

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

    var controls = h('span.controls', [
      ToggleButton(state.rawMode, {
        title: 'raw'
      }),
      Select(state.zoom, {
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
      h('header', [state.items._list.map(renderTab), controls]),
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

  var noMidi = !window.navigator.requestMIDIAccess

  return h('div CenterTab', [

    noMidi ? renderNoMidi() : null,

    h('div Helper', [
      h('a', {href: 'http://loopjs.com/'}, [
        h('img', {src: 'file://' + join(__dirname, '..', 'logo.png'), width: 128})
      ]),
      h('br'),
      'For help visit ',
      h('a', {href: 'http://loopjs.com/'}, 'loopjs.com')
    ])

  ])
}

function renderNoMidi(){
  return h('div Helper -warning', [
    h('header', 'MIDI not enabled'),
    h('p', [
      'To use midi controllers with Loop Drop, you need to go to ', 
      h('strong', 'chrome://flags#enable-web-midi'), 
      ' and click enable then restart Chrome.' 
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