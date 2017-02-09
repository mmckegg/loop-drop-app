var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var when = require('mutant/when')
var Range = require('lib/params/range')
var Editable = require('lib/params/editable')

module.exports = function (node, opts) {
  var actions = node.context.actions
  var selected = computed([node.id, node.context.setup.selectedChunkId], eq)

  return h('ExternalNode', {
    classList: [
      when(node.minimised, '-minimised'),
      when(selected, '-selected')
    ],
    'ev-click': send(selectChunk, node),
    'style': {
      border: computed([node.color, selected], function (color, selected) {
        return '2px solid ' + cssColor(color, selected ? 1 : 0)
      })
    }
  }, [
    h('header', {
      style: {
        'background-color': computed([node.color, selected], function (color, selected) {
          return cssColor(color, selected ? 0.5 : 0.1)
        })
      }
    }, [
      h('button.twirl', {
        'ev-click': send(toggleParam, node.minimised)
      }),
      Editable(node.id, {
        enabled: selected,
        onChange: (oldValue, newValue) => actions.updateChunkReferences(oldValue, newValue, node)
      }),
      opts.extraHeader,
      opts.volume ? Range(node.volume, {format: 'dB', title: 'vol', defaultValue: 1, width: 150, pull: true}) : null,
      opts.external ? h('button.edit Button -edit', {
        'ev-click': send(editChunk, node)
      }, 'edit') : null,
      h('button.remove Button -warn', {
        'ev-click': send(remove, node)
      }, 'X')
    ]),
    when(node.minimised, '', opts.main)
  ])
}

function remove (chunk) {
  var project = chunk.context.project
  var collection = chunk.context.collection
  var fileObject = chunk.context.fileObject
  var setup = chunk.context.setup
  var descriptor = chunk()

  collection.remove(chunk)
  setup.updateChunkReferences(descriptor.id, null)

  // delete file if id matches file name and file is in cwd
  if (descriptor.id && chunk.getPath) {
    var path = chunk.getPath()
    var truePath = fileObject.resolvePath(descriptor.id + '.json')
    if (path === truePath) {
      project.actions.deleteEntry(path)
    }
  }
}

function editChunk (chunk) {
  var context = chunk.context
  var fileObject = chunk.context.fileObject
  context.actions.openExternal(fileObject)
}

function selectChunk (chunk) {
  var setup = chunk.context.setup
  setup.selectedChunkId.set(chunk.id())
}

function toggleParam (param) {
  param.set(!param())
}

function eq (a, b) {
  return a === b
}

function cssColor (rgb, a) {
  if (!Array.isArray(rgb)) {
    rgb = [100, 100, 100]
  }
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
}
