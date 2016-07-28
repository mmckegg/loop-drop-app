var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var Map = require('@mmckegg/mutant/map')

var getBaseName = require('path').basename
var getExt = require('path').extname
var join = require('path').join

var RenameWidget = require('lib/rename-widget')
var DomEvent = require('lib/dom-event')

module.exports = renderBrowser

function renderBrowser (entries, project) {
  var elements = Map(entries, function (entry) {
    var base = getBaseName(entry.path)
    if (entry.type === 'directory' && base !== '~recordings') {
      // TODO: optimize sub-entries!
      var subEntries = computed(project.subEntries, x => x && x[entry.path] || [])
      return concat([
        renderEntry(entry, project),
        Map(subEntries, function (subEntry) {
          var fileName = getBaseName(subEntry.path)
          var ext = getExt(fileName)
          if (subEntry.type === 'file' && fileName !== 'index.json' && ext === '.json') {
            return renderEntry(subEntry, project)
          }
        })
      ])
    }
  })

  return h('ScrollBox', elements)
}

function renderEntry (entry, project) {
  var actions = project.actions

  var classList = computed([
    entry, project.renaming, project.recordingPath, project.selected, project.subEntries
  ], computeClasses)

  return h('BrowserFile', {
    'data-entry': entry,
    'draggable': true,
    'ev-dragstart': DomEvent(dragStart, entry),
    'ev-click': { entry: entry, project: project, handleEvent: handleClick },
    'ev-dblclick': send(actions.open, entry.path),
    'classList': classList
  }, [
    h('button.twirl', {
      'ev-click': send(actions.toggleDirectory, entry.path)
    }),
    computed(project.renaming, function (renaming) {
      if (renaming === entry.path) {
        return RenameWidget(entry.fileName, function (newName) {
          actions.rename(entry.path, newName)
          project.renaming.set(false)
        }, function () {
          project.renaming.set(false)
        })
      } else {
        return h('span', getBaseName(entry.fileName, '.json'))
      }
    }),
    h('button.delete', {
      'ev-click': send(actions.deleteEntry, entry.path)
    }, 'delete')
  ])
}

function handleClick (ev) {
  var selected = this.project.selected() === this.entry.path || join(this.entry.path, 'index.json') === this.project.selected()
  if (selected && this.project.renaming() !== this.entry.path) {
    this.project.renaming.set(this.entry.path)
  }
}

function computeClasses (entry, renamingPath, recordingPath, selectedPath, subEntries) {
  var selected = selectedPath === entry.path
  var result = []
  if (recordingPath === entry.path) {
    result.push('-recording')
  }

  if (renamingPath === entry.path) {
    result.push('-renaming')
  }

  if (entry.type === 'directory') {
    result.push('-directory')
    if (subEntries[entry.path]) {
      result.push('-open')
    }

    // handle index.json selected
    selected = selected || join(entry.path, 'index.json') === selectedPath

    if (selected) {
      result.push('-selected')
    }
  }
  return result.join(' ')
}

function dragStart (ev) {
  window.currentDrag = null
  ev.dataTransfer.setData('filepath', ev.data.path)
}

function concat (items) {
  return computed(items, function (args) {
    return Array.prototype.concat.apply([], arguments)
  })
}
