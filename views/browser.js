var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var e = mercury.event

var getBaseName = require('path').basename
var getExt = require('path').extname

var renameWidget = require('lib/rename-widget')
var DragEvent = require('lib/drag-event')

var currentRename = null

module.exports = renderBrowser

function renderBrowser(state, actions){

  var entries = []

  // render two-level tree
  if (state.entries()){
    state.entries().forEach(function(entry){
      if (entry.type === 'directory'){
        entries.push(renderEntry(entry, state, actions))
        var sub = state.subEntries.get(entry.path)
        if (sub && sub()){
          sub().forEach(function(subEntry){
            var fileName = getBaseName(subEntry.path)
            var ext = getExt(fileName)
            if (subEntry.type === 'file' && fileName !== 'index.json' && ext === '.json'){
              entries.push(renderEntry(subEntry, state, actions))
            }
          })
        }
      }
    })
  }

  return h('div', {className: 'Browser'}, [
    h('header', [
      h('span', 'Setups'), h('button.new', {'ev-click': e(actions.newSetup)}, '+ New')
    ]),
    h('ScrollBox', entries)
  ])
}

function renderEntry(entry, state, actions){

  var selected = state.selected() == entry.path
    
  var classList = []
  var expander = ''

  if (entry.type === 'directory'){
    classList.push('-directory')
    expander = h('button.twirl', {
      'ev-click': mercury.event(actions.toggleDirectory, entry.path)
    })

    if (state.subEntries.get(entry.path)){
      classList.push('-open')
    }

    // handle index.json selected
    selected = selected || entry.path + '/index.json' === state.selected()
  }

  var renaming = selected && state.renaming()
  var renameState = { state: state, entry: entry, actions: actions }

  // handle rename click
  var click = selected ?
    mercury.event(state.renaming.set, true) : null

  if (selected){
    classList.push('-selected')
  }
  if (renaming){
    classList.push('-renaming')
    currentRename = renameWidget(entry.fileName, saveRename, cancelRename, renameState)
  }

  var buttons = [
    h('button.delete', {
      'ev-click': e(actions.deleteEntry, entry.path),
    }, 'delete')
  ]

  if (renaming){
    buttons.push(
      h('button.save', {
        'ev-click': e(saveRename, renameState)
      }, 'save'),
      h('button.cancel', {
        'ev-click': e(cancelRename, renameState)
      }, 'cancel')
    )
  }

  var nameElement = renaming ? 
    currentRename : h('span', getBaseName(entry.fileName, '.json'))

  return h('BrowserFile', { 
    'data-entry': entry,
    'draggable': true,
    'ev-dragstart': DragEvent(dragStart, entry),
    'ev-click': click,
    'ev-dblclick': e(actions.open, entry.path),
    'className': classList.join(' ')
  }, [expander, nameElement, buttons ])
}

function dragStart(ev){
  window.currentDrag = null
  ev.dataTransfer.setData('filepath', ev.data.path)
}

function saveRename(){
  var state = this.data.state
  var entry = this.data.entry
  var actions = this.data.actions
  if (currentRename){
    actions.rename(entry.path, currentRename.getValue())
  }

  state.renaming.set(false)
}

function cancelRename(){
  var state = this.data.state
  state.renaming.set(false)
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