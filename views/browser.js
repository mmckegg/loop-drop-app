var mercury = require('mercury')
var e = mercury.event
var h = mercury.h
var getBaseName = require('path').basename
var renameWidget = require('../lib/rename-widget')

module.exports = Browser

function Browser(state, actions){

  var currentRename = null

  function saveRename(){
    if (currentRename && state.renaming() && state.selected()){
      var newFileName = currentRename.getValue()
      var item = getItemByPath(state.items, state.selected())
      if (item){
        item.rename(newFileName)
      }
      state.selected.set(item.file.path)
      state.renaming.set(false)
    }
  }

  function cancelRename(){
    state.renaming.set(false)
  }

  return function(header){
    var data = state()
    return h('div', [
      h('header', [
        h('span', header), h('button', {'ev-mousedown': e(actions.newFile),'className': '.new'}, 'New')
      ]),
      forceArray(data.entries).filter(check).map(renderEntry)
    ])
  }

  function renderEntry(entry){

    var selected = state.selected() == entry.path
    var renaming = selected && state.renaming()

    if (renaming){
      console.log('renaming', entry.path)
    }

    // handle rename click
    var click = selected ?
      mercury.event(state.renaming.set, true) :
      mercury.event(state.selected.set, entry.path)
      
    var classList = []
    if (selected){
      classList.push('-selected')
    }
    if (renaming){
      classList.push('-renaming')
      currentRename = renameWidget(entry.fileName, saveRename, cancelRename)
    }

    var buttons = [
      h('button', {
        'className': '.delete',
        'ev-mousedown': e(actions.deleteFile, entry.path),
      }, 'delete'),
      h('button', {
        'className': '.newWindow',
        'ev-mousedown': e(actions.openNewWindow, entry.path)
      }, '+')
    ]

    if (renaming){
      buttons.push(
        h('button', {
          'className': '.save',
          'ev-mousedown': e(saveRename)
        }, 'save'),
        h('button', {
          'className': '.cancel',
          'ev-mousedown': e(cancelRename)
        }, 'cancel')
      )
    }

    var nameElement = renaming ? 
      currentRename : h('span', getBaseName(entry.fileName, '.json'))

    return h('div.BrowserFile', { 
      'ev-mousedown': click,
      'className': classList.join(' ')
    }, [ nameElement, buttons ])
  }

  var renameState = {
    path: null,
    selection: null
  }

}

function forceArray(maybeArray){
  if (Array.isArray(maybeArray)){
    return maybeArray
  } else {
    return []
  }
}

function check(entry){
  return (entry.type === 'file')
}

function getItemByPath(items, path){
  var result = null
  items.some(function(item){
    if (item.path === path){
      result = item
      return true
    }
  })
  return result
}