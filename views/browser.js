var mercury = require('mercury')
var h = mercury.h

module.exports = Browser

function Browser(state){

  return function(){
    var data = state()
    return h('div', [
      forceArray(data.entries).map(renderEntry)
    ])
  }

  function renderEntry(entry){
    //if (entry.type === 'directory'){
    //  var entries = entry.entries || []
    //  return h('div.BrowserDirectory', [
    //    h('span', {className: '.title'}, entry.fileName),
    //    h('div', {className: '.sub'}, entries.map(renderEntry.bind(root)))
    //  ])
    //} else {

    var selected = state.selected() == entry.path
    return h('div.BrowserFile', { 
      'ev-mousedown': mercury.event(state.selected.set, entry.path),
      'className': selected ? '-selected' : null
    }, entry.fileName)
  }

}

function forceArray(maybeArray){
  if (Array.isArray(maybeArray)){
    return maybeArray
  } else {
    return []
  }
}