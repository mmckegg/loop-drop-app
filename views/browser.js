var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var e = mercury.event

var getBaseName = require('path').basename
var renameWidget = require('../lib/rename-widget')
var DataTransfer = require('../lib/data-transfer')

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

  function dragStart(ev){
    window.currentDrag = null
    ev.dataTransfer.setData('filesrc', window.context.project.relative(ev.data.path))
  }

  return function(header, className){
    var data = state()
    return h('div', {className: className}, [
      h('header', [
        h('span', header), h('button.new', {'ev-click': e(actions.newFile)}, 'New')
      ]),
      h('ScrollBox', [
        forceArray(data.entries).filter(check).map(renderEntry)
      ])
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
      mercury.event(state.renaming.set, true) : null
      
    var classList = []
    if (selected){
      classList.push('-selected')
    }
    if (renaming){
      classList.push('-renaming')
      currentRename = renameWidget(entry.fileName, saveRename, cancelRename)
    }

    var buttons = [
      h('button.delete', {
        'ev-click': e(actions.deleteFile, entry.path),
      }, 'delete')
    ]

    if (renaming){
      buttons.push(
        h('button.save', {
          'ev-click': e(saveRename)
        }, 'save'),
        h('button.cancel', {
          'ev-click': e(cancelRename)
        }, 'cancel')
      )
    }

    var nameElement = renaming ? 
      currentRename : h('span', getBaseName(entry.fileName, '.json'))

    return h('BrowserFile', { 
      'data-entry': entry,
      'draggable': true,
      'ev-dragstart': DataTransfer(dragStart, entry),
      'ev-click': click,
      'ev-dblclick': e(actions.open, entry.path),
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