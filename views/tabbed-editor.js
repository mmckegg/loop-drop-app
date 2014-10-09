var mercury = require("mercury")
var h = mercury.h
var getBaseName = require('path').basename

var renderEditor = require('./editor')
var rawEditor = require('loop-drop-editor/raw')
module.exports = TabbedEditor

function TabbedEditor(state, actions){

  return function(){
    var data = state()
    var fileObject = getItem(state)

    var editor = (data.rawMode && fileObject) ?
      rawEditor(fileObject.file) :
      renderEditor(fileObject)

    return h('div.TabbedEditor', [
      h('header', data.items.map(renderTab)),
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

    var selected = state.selected() == item._path
    return h('div', { 
      'ev-mousedown': mercury.event(state.selected.set, item._path),
      'className': selected ? '.tab -selected' : '.tab'
    }, [
      h('span', getBaseName(item._path, '.json')), 
      h('button', {'ev-click': mercury.event(actions.closeFile, item._path), className: '.close'})
    ])
  }

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