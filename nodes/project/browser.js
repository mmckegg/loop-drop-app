var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var Map = require('mutant/map')

var getBaseName = require('path').basename
var getDirectory = require('path').dirname
var join = require('path').join

var RenameWidget = require('lib/rename-widget')

module.exports = renderBrowser

function renderBrowser (entries, project) {
  var elements = Map(entries, function (entry) {
    return renderEntry(entry, project)
  })

  return h('ScrollBox', elements)
}

function renderEntry (entry, project) {
  var actions = project.actions

  var classList = computed([
    entry, project.renaming, project.recordingPath, project.selected
  ], computeClasses)

  return h('BrowserFile', {
    'data-entry': entry,
    'ev-click': { entry: entry, project: project, handleEvent: handleClick },
    'ev-dblclick': send(actions.open, entry.path),
    'classList': classList
  }, [
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

function computeClasses (entry, renamingPath, recordingPath, selectedPath) {
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

    // handle sub item selected
    if (selectedPath) {
      selected = selected || entry.path === getDirectory(selectedPath)
    }
  }

  if (selected) {
    result.push('-selected')
  }

  return result.join(' ')
}
