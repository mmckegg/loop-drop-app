var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var SubLoop = require('lib/sub-loop')
var ObservClassHook = require('lib/observ-class-hook')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var MPE = require('lib/mouse-position-event.js')
var read = require('lib/read')

module.exports = function (node) {
  if (node) {
    var context = node.context
    var collection = context.collection

    var nameSuffix = node().port ? ' (' + node().port + ')' : ''
    return h('div MixerNode', {
      'ev-class': ObservClassHook(node.activeInput, '-input')
    }, [
      h('header', [
        h('span', 'Mixer' + nameSuffix),
        h('button.remove Button -warn', {
          'ev-click': send(collection.remove, node)
        }, 'X')
      ]),
      h('section', [
        h('div.channels', renderChannels(node)),
        h('div.controls', renderParams(node))
      ])
    ])
  } else {
    return h('div')
  }
}

module.exports.getInvalidationArgs = function (node) {
  return [node.context.chunkLookup(), node.context.setup.selectedChunkId()]
}

function renderChannels (controller) {
  var result = []
  var chunkIds = controller.chunkIds()
  var selectedChunkId = controller.context.setup.selectedChunkId()
  for (var i = 0; i < 8; i++) {
    var id = chunkIds[i]
    var chunk = controller.context.chunkLookup.get(id)
    var chunkObject = controller.context.setup.chunks.lookup.get(id)
    var dragInfo = { collection: controller.chunkIds, chunkId: id, index: i, select: controller.context.setup.selectedChunkId.set }
    if (chunk) {
      var color = chunk().color || [50, 50, 50]
      result.push(h('div -channel', {
        className: selectedChunkId === chunk.id() ? '-selected' : null,
        style: {
          'border-color': cssColor(color, 1),
          'background-color': cssColor(multiply(color, 0.3), 1),
          'color': cssColor(multiply(color, 20), 1)
        },
        'draggable': true,
        'ev-dragstart': MPE(dragStart, dragInfo),
        'ev-dragend': MPE(dragEnd, dragInfo),
        'ev-dragover': MPE(dragOver, dragInfo),
        'ev-dragleave': MPE(dragLeave, dragInfo),
        'ev-drop': MPE(drop, dragInfo),
        'ev-click': send(selectChunk, chunk),
        'ev-dblclick': send(toggleChunk, chunkObject)

      }, [
        h('div.title', chunk().id),
        h('button.remove', {
          'ev-click': send(remove, { value: id, obj: controller.chunkIds })
        }, 'X')
      ]))
    } else {
      result.push(h('div -placeholder', {
        'ev-dragover': MPE(dragOver, dragInfo),
        'ev-dragleave': MPE(dragLeave, dragInfo),
        'ev-drop': MPE(drop, dragInfo)
      }))
    }
  }
  return result
}

function selectChunk (chunk) {
  chunk.context.setup.selectedChunkId.set(chunk().id)
  chunk.context.actions.scrollToSelectedChunk()
}

function toggleChunk (chunk) {
  var minimised = chunk.minimised || QueryParam(chunk, 'minimised')
  minimised.set(!read(minimised))
}

var draggedElement = null

function dragStart (ev) {
  draggedElement = ev.currentTarget
  ev.dataTransfer.setData('loop-drop/chunk-id', ev.data.chunkId)
}

function dragEnd (ev) {
  draggedElement = null
}

function dragOver (ev) {
  var types = ev.dataTransfer.types
  console.log(ev)
  if (ev.currentTarget !== draggedElement && (types.includes('loop-drop/chunk-id') || types.includes('loop-drop/chunk'))) {
    ev.currentTarget.classList.add('-dragOver')
    ev.dataTransfer.dropEffect = 'move'
    ev.event.preventDefault()
  }
}

function drop (ev) {
  var types = ev.dataTransfer.types
  var chunkId = ev.dataTransfer.getData('loop-drop/chunk-id')

  if (types.includes('loop-drop/chunk')) {
    chunkId = JSON.parse(ev.dataTransfer.getData('loop-drop/chunk')).id
  }

  dragLeave(ev)
  ev.event.preventDefault()

  if (chunkId) {
    var collection = ev.data.collection
    var value = collection().slice().map(x => x === chunkId ? null : x)
    value[ev.data.index] = chunkId
    collection.set(value)
    ev.data.select(chunkId)
  }
}

function dragLeave (ev) {
  ev.currentTarget.classList.remove('-dragOver')
}

function remove (opts) {
  opts.obj.set(opts.obj().map(function (id) {
    if (id === opts.value) {
      return null
    } else {
      return id
    }
  }))
}

function cssColor (rgb, a) {
  if (!Array.isArray(rgb)) {
    rgb = [100, 100, 100]
  }
  return 'rgba(' + Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]) + ',' + a + ')'
}

function multiply (rgb, value) {
  if (typeof value === 'number') {
    value = [value, value, value]
  }
  return [
    rgb[0] * value[0],
    rgb[1] * value[1],
    rgb[2] * value[2]
  ]
}

function renderParams (controller) {
  var spawners = controller.context.nodeInfo.groupLookup['mixers']
  var controllerOptions = spawners.map(function (info) {
    return [info.name, info.node]
  })
  var params = [
    Select(QueryParam(controller, 'node'), {
      options: controllerOptions,
      flex: true,
      missingPrefix: ' (unknown)'
    })
  ]

  if (controller.port) {
    params.push(
      SubLoop([controller.port, controller.context.midiPorts], renderPortChoices)
    )
  }

  return h('ParamList', params)
}

function renderPortChoices (port, choices) {
  return Select(port, {
    options: choices,
    flex: true,
    missingPrefix: ' (disconnected)',
    includeBlank: 'No Midi Device'
  })
}
