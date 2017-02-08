var h = require('lib/h')
var send = require('mutant/send')
var when = require('mutant/when')
var computed = require('mutant/computed')
var resolve = require('mutant/resolve')

var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var MPE = require('lib/mouse-position-event.js')

module.exports = function (node) {
  var context = node.context
  var collection = context.collection
  var nameSuffix = computed(node.port, p => p ? ' (' + p + ')' : '')
  return h('div MixerNode', {
    classList: when(node.activeInput, '-input')
  }, [
    h('header', [
      h('span', ['Mixer', nameSuffix]),
      h('button.remove Button -warn', {
        'ev-click': send(collection.remove, node)
      }, 'X')
    ]),
    h('section', [
      h('div.channels', renderChannels(node)),
      h('div.controls', renderParams(node))
    ])
  ])
}

function renderChannels (controller) {
  var selectedChunkId = controller.context.setup.selectedChunkId
  return computed(controller.chunkIds, function (chunkIds) {
    var result = []
    for (var i = 0; i < 8; i++) {
      var id = chunkIds[i]
      var dragInfo = { collection: controller.chunkIds, chunkId: id, index: i, select: controller.context.setup.selectedChunkId.set }
      if (id) {
        var color = chunkColor(controller.context, id)
        result.push(h('div -channel', {
          classList: computed([id, selectedChunkId], selectedClassWhenEq),
          style: {
            'border-color': computed(color, c => cssColor(c, 1)),
            'background-color': computed(color, c => cssColor(multiply(c, 0.3), 1)),
            'color': computed(color, c => cssColor(multiply(c, 20), 1))
          },
          'draggable': true,
          'ev-dragstart': MPE(dragStart, dragInfo),
          'ev-dragend': MPE(dragEnd, dragInfo),
          'ev-dragover': MPE(dragOver, dragInfo),
          'ev-dragleave': MPE(dragLeave, dragInfo),
          'ev-drop': MPE(drop, dragInfo),
          'ev-click': send(selectChunk, { context: controller.context, id: id }),
          'ev-dblclick': send(toggleChunk, { context: controller.context, id: id })

        }, [
          h('div.title', id),
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
  })
}

function chunkColor (context, id) {
  var lastColor = []
  return computed([context.chunkLookup, id], function (lookup, id) {
    var color = valueOrDefaultColor(lookup[id] && lookup[id].color)
    if (colorEq(color, lastColor)) {
      return computed.NO_CHANGE
    } else {
      lastColor[0] = color[0] || 0
      lastColor[1] = color[1] || 0
      lastColor[2] = color[2] || 0
      return lastColor
    }
  })
}

function colorEq (a, b) {
  return a === b || (a && b && a.length === b.length && a[0] === b[0] && a[1] === b[1] && a[2] === b[2])
}

function selectedClassWhenEq (a, b) {
  return a === b ? '-selected' : null
}

function selectChunk (info) {
  info.context.setup.selectedChunkId.set(info.id)
  info.context.actions.scrollToSelectedChunk()
}

function toggleChunk (info) {
  var chunk = info.context.chunkLookup.get(info.id)
  chunk.minimised.set(!resolve(chunk.minimised))
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
  if (ev.currentTarget !== draggedElement && (types.includes('loop-drop/chunk-id') || types.includes('loop-drop/chunk'))) {
    ev.currentTarget.classList.add('-dragOver')
    ev.dataTransfer.dropEffect = 'link'
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

function valueOrDefaultColor (color) {
  return color || [50, 50, 50]
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
    var info = controller.context.nodeInfo.lookup[controller().node]
    var portMatch = info && info.portMatch
    params.push(
      renderPortChoices(controller.port, controller.context.midiPorts, portMatch)
    )
  }

  return h('ParamList', params)
}

function renderPortChoices (port, choices, portMatch) {
  var matchingChoices = computed([portMatch, choices], function (portMatch, choices) {
    if (portMatch && choices) {
      return choices.filter(function (choice) {
        return choice.match(portMatch)
      })
    } else {
      return choices
    }
  })

  return Select(port, {
    options: matchingChoices,
    flex: true,
    missingPrefix: ' (disconnected)',
    includeBlank: 'No Midi Device'
  })
}
