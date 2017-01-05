var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var when = require('@mmckegg/mutant/when')
var watch = require('@mmckegg/mutant/watch')
var resolve = require('@mmckegg/mutant/resolve')
var MPE = require('lib/mouse-position-event')
var MouseDragEvent = require('lib/mouse-drag-event')
var read = require('lib/read')
var computed = require('@mmckegg/mutant/computed')

var QueryParam = require('lib/query-param')

module.exports = function renderGrid (controller) {
  var playback = controller.playback
  var rows = computed(playback.shape, s => s[0])
  var cols = computed(playback.shape, s => s[1])

  return h('LoopGrid', {
    classList: computed(cols, c => c > 16 ? '-min' : ''),
    'ev-dragover': MPE(dragOver, controller),
    'ev-drop': MPE(drop, controller),
    'ev-dragleave': MPE(dragLeave, controller),
    'ev-dragenter': MPE(dragEnter, controller)
  }, [
    renderRows(controller, rows, cols),
    h('div.chunks', MapChunkPositions(controller, renderChunkBlock))
  ])
}

function renderRows (controller, rows, cols) {
  return computed([rows, cols], function (rows, cols) {
    var children = []
    for (var r = 0; r < rows; r++) {
      var buttons = []
      for (var c = 0; c < cols; c++) {
        buttons.push(h('div.button', {
          'ev-dragenter': MPE(enterButton, controller),
          'ev-dragleave': MPE(leaveButton, controller)
        }))
      }
      children.push(h('div.row', buttons))
    }

    return h('div.rows', {
      hooks: [
        GridStateHook(controller.gridState)
      ]
    }, children)
  })
}

function GridStateHook (gridState) {
  return function (element) {
    return watch(gridState, function (data) {
      // TODO: this could be a lot more efficient if it was event based
      var playing = data.playing
      var active = data.active
      var triggers = data.triggers
      var recording = data.recording

      for (var r = 0; r < triggers.shape[0]; r++) {
        for (var c = 0; c < triggers.shape[1]; c++) {
          var button = element.childNodes[r].childNodes[c]
          var classes = '.button'

          if (triggers.get(r, c)) classes += ' -present'
          if (playing.get(r, c)) classes += ' -playing'
          if (recording.get(r, c)) classes += ' -recording'
          if (active.get(r, c)) classes += ' -active'

          if (button.className !== classes) {
            button.className = classes
          }
        }
      }
    })
  }
}

function renderChunkBlock (controller, chunk, origin) {
  var setup = controller.context.setup
  var bounds = controller.playback.shape

  if (chunk) {
    var selected = computed([setup.selectedChunkId, chunk.id], eq)
    var resizable = !!chunk.templateSlot || !chunk.slots

    return h('div.chunk', {
      classList: [
        when(selected, '-selected')
      ],
      style: {
        'top': computed([origin, bounds], (o, b) => percent(o[0] / b[0])),
        'height': computed([origin, chunk.shape, bounds], (o, s, b) => percent(((o[0] + s[0]) / b[0]) - (o[0] / b[0]))),
        'left': computed([origin, bounds], (o, b) => percent(o[1] / b[1])),
        'width': computed([origin, chunk.shape, bounds], (o, s, b) => percent(((o[1] + s[1]) / b[1]) - (o[1] / b[1]))),
        'border-color': color(chunk.color, 1),
        'background-color': color(chunk.color, 0.1),
        'color': color(mixColor(chunk.color, [255, 255, 255]), 1)
      },
      draggable: true,
      'ev-click': send(selectChunk, { chunk, controller }),
      'ev-dblclick': send(toggleChunk, chunk),
      'ev-dragstart': MPE(startDrag, { chunk, controller }),
      'ev-dragend': MPE(endDrag, chunk)
    }, [
      h('span.label', chunk.id),
      resizable ? [
        h('div.handle -bottom', {
          draggable: true,
          'ev-mousedown': MouseDragEvent(resize, { edge: 'bottom', node: chunk, shape: bounds })
        }),
        h('div.handle -right', {
          draggable: true,
          'ev-mousedown': MouseDragEvent(resize, { edge: 'right', node: chunk, shape: bounds })
        })
      ] : null,
      h('button.remove', {
        'ev-click': send(remove, { key: chunk.id, obj: controller.chunkPositions })
      }, 'X')
    ])
  }
}

function remove (info) {
  info.obj.delete(resolve(info.key))
}

function resize (ev) {
  var edge = this.data.edge
  var node = this.data.node
  var shape = this.data.shape()
  var param = node.shape || QueryParam(node, 'shape')

  if (ev.type === 'mousedown') {
    this.lastOffset = 0
    this.startValue = param()
    this.start = ev
  } else if (this.start) {
    if (edge === 'bottom') {
      var offset = Math.round((ev.y - this.start.y) / 30)
      if (this.lastOffset !== offset) {
        param.set([ clamp1(this.startValue[0] + offset), this.startValue[1] ])
        this.lastOffset = offset
      }
    } else if (edge === 'right') {
      var offset = Math.round((ev.x - this.start.x) / (248 / shape[1]))
      if (this.lastOffset !== offset) {
        param.set([ this.startValue[0], clamp1(this.startValue[1] + offset) ])
        this.lastOffset = offset
      }
    }
  }
}

function clamp1 (val) {
  return Math.max(val, 1)
}

function eq (a, b) {
  return a === b
}

function enterButton (ev) {
  ev.currentTarget.classList.add('-dragOver')
}

function leaveButton (ev) {
  ev.currentTarget.classList.remove('-dragOver')
}

function startDrag (ev) {
  var chunk = ev.data.chunk
  var controller = ev.data.controller

  var data = resolve(chunk)
  var type = data.node.split('/')[0]
  if (type === 'externalChunk') {
    type = 'chunk'
  }

  ev.node = chunk
  ev.origin = {
    controller: controller,
    coords: controller.chunkPositions.get(chunk.id())
  }
  ev.dataTransfer.setData('loop-drop/' + type, JSON.stringify(data))
  ev.dataTransfer.setData('cwd', chunk.context.cwd)
  window.currentDrag = ev
}

function endDrag (ev) {
  window.currentDrag = null
}

var entering = null
function dragLeave (ev) {
  var controller = ev.data
  if (window.currentDrag && (!entering || entering !== controller)) {
    var chunkId = getId(window.currentDrag.node)
    if (chunkId && !ev.altKey && !ev.shiftKey) {
      // NASTY!
      window.currentDrag.node.context.setup.controllers.forEach((c) => c.chunkPositions && c.chunkPositions.delete(chunkId))
      if (window.currentDrag.origin) {
        window.currentDrag.origin.controller.chunkPositions.put(chunkId, window.currentDrag.origin.coords)
      }
    }
  }
}
function dragEnter (ev) {
  entering = ev.data

  setTimeout(function () {
    entering = null
  }, 1)
}

function getId (chunk) {
  if (chunk) {
    return resolve(chunk.id)
  }
}

function dragOver (ev) {
  var controller = ev.data
  var currentDrag = window.currentDrag
  var originalDirectory = currentDrag.node.context.cwd

  if (ev.altKey || ev.shiftKey) {
    ev.dataTransfer.dropEffect = 'copy'
  } else if (currentDrag && originalDirectory === controller.context.cwd) {
    var chunkId = getId(currentDrag.node)
    if (chunkId) {
      var shape = controller.playback.shape()
      var height = ev.offsetHeight / shape[0]
      var width = ev.offsetWidth / shape[1]

      var x = ev.offsetX - currentDrag.offsetX
      var y = ev.offsetY - currentDrag.offsetY

      var r = Math.round(y / height)
      var c = Math.round(x / width)

      var currentValue = controller.chunkPositions.get(chunkId)

      if (!currentValue || currentValue[0] !== r || currentValue[1] !== c) {
        currentDrag.node.context.setup.controllers.forEach((c) => c.chunkPositions && c.chunkPositions.delete(chunkId))
        controller.chunkPositions.put(chunkId, [r, c])
      }
    }
  }

  if (ev.dataTransfer.types.length) {
    // HACK: detect when dragging from chunks - prevent remove
    // need to rewrite all the drag and drop to be native, without currentDrag hacks
    ev.dataTransfer.dropEffect = 'link'
  } else {
    ev.dataTransfer.dropEffect = 'move'
  }

  ev.event.preventDefault()
}

function drop (ev) {
  var data = ev.dataTransfer.getData('loop-drop/chunk')
  var originalDirectory = ev.dataTransfer.getData('cwd')

  if (data && originalDirectory) {
    var controller = ev.data
    var setup = controller.context.setup

    var shape = controller.playback.shape()
    var height = ev.offsetHeight / shape[0]
    var width = ev.offsetWidth / shape[1]
    var r = Math.floor(ev.offsetY / height)
    var c = Math.floor(ev.offsetX / width)

    if (ev.altKey || ev.shiftKey || originalDirectory !== controller.context.cwd) {
      var chunk = JSON.parse(data)
      setup.importChunk(chunk, originalDirectory, function (err, id) {
        if (err) throw err
        controller.chunkPositions.put(id, [r, c])
      })
    }
  }
}

function percent (decimal) {
  return (decimal * 100) + '%'
}

function color (rgb, a) {
  return computed([rgb, a], function (rgb, a) {
    if (!Array.isArray(rgb)) {
      rgb = [100, 100, 100]
    }
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
  })
}

function mixColor (a, b) {
  return computed([a, b], function (a, b) {
    if (!Array.isArray(a)) {
      return b
    }
    return [
      (a[0] + a[0] + b[0]) / 3,
      (a[1] + a[0] + b[1]) / 3,
      (a[2] + a[0] + b[2]) / 3
    ]
  })
}

function toggleChunk (chunk) {
  var minimised = chunk.minimised || QueryParam(chunk, 'minimised')
  minimised.set(!read(minimised))
}

function selectChunk (target) {
  var controller = target.controller
  var setup = controller.context.setup
  var actions = controller.context.actions
  controller.grabInput && controller.grabInput()
  setup.selectedChunkId.set(target.chunk.id())
  actions.scrollToSelectedChunk()
}

function MapChunkPositions (controller, lambda) {
  var positions = {}
  var chunks = {}
  var mapped = {}
  var result = []

  return computed([controller.chunkPositions, controller.context.chunkLookup], function (chunkPositions, _) {
    var i = 0
    for (var k in chunkPositions) {
      var chunk = controller.context.chunkLookup.get(k)
      if (!positions[k] || chunkPositions[k][0] !== positions[k][0] || chunkPositions[k][1] !== positions[k][1] || chunks[k] !== chunk) {
        if (chunk) {
          chunks[k] = chunk
          mapped[k] = lambda(controller, chunk, chunkPositions[k])
          if (!positions[k]) {
            positions[k] = [0, 0]
          }
          positions[k][0] = chunkPositions[k][0]
          positions[k][1] = chunkPositions[k][1]
        }
      }
      result[i] = mapped[k]
      i += 1
    }
    result.length = i
    return result
  })
}
