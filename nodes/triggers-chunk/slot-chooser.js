var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var when = require('@mmckegg/mutant/when')
var computed = require('@mmckegg/mutant/computed')
var Keys = require('@mmckegg/mutant/keys')

var MPE = require('lib/mouse-position-event.js')
var importSample = require('lib/import-sample')
var extend = require('xtend/immutable')

module.exports = SlotChooser

function SlotChooser (chunk, spawnSlot) {
  var rows = computed(chunk.shape, s => s[0])
  var cols = computed(chunk.shape, s => s[1])

  var slots = chunk.context.slotLookup
  var slotIds = Keys(slots)

  var triggers = computed([rows, cols, slotIds], function (rows, cols, slotIds) {
    var result = []
    var length = rows * cols

    for (var i = 0; i < length; i++) {
      var id = String(i)
      var selected = computed([chunk.selectedSlotId, id], eq)
      var slot = slots.get(id)
      var width = (100 / cols) + '%'
      var dragInfo = { collection: chunk.slots, id: id, select: chunk.selectedSlotId.set, spawnSlot: spawnSlot, chunk: chunk }

      if (slotIds.includes(id)) {
        result.push(
          h('div.slot', {
            'draggable': true,

            'ev-dragstart': MPE(dragStart, dragInfo),
            'ev-dragend': MPE(dragEnd, dragInfo),
            'ev-dragover': MPE(dragOver, dragInfo),
            'ev-dragleave': MPE(dragLeave, dragInfo),
            'ev-drop': MPE(drop, dragInfo),

            'style': {width: width},
            'classList': [
              when(selected, '-selected'),
              computed([chunk.activeSlots, id, '-active'], valueWhen)
            ],
            'ev-click': send(chunk.selectedSlotId.set, id)
          }, [
            id,
            h('button.remove', {
              'ev-click': send(chunk.slots.remove, slot)
            }, 'X')
          ])
        )
      } else {
        result.push(
          h('div.slot -spawn', {
            'style': {width: width},

            'ev-dragover': MPE(dragOver, dragInfo),
            'ev-dragleave': MPE(dragLeave, dragInfo),
            'ev-drop': MPE(drop, dragInfo),

            'ev-click': send(spawnSlot, { id: id, chunk: chunk })
          }, '+ trigger')
        )
      }
    }
    return result
  })

  return h('SlotChooser', [
    triggers,
    h('div.spacer'),
    h('div.slot -output', {
      'classList': computed(chunk.selectedSlotId, s => s === 'output' ? '-selected' : ''),
      'ev-click': send(chunk.selectedSlotId.set, 'output')
    }, 'output')
  ])
}

var currentDrag = null

function dragStart (ev) {
  currentDrag = ev.data
}

function dragEnd (ev) {
  currentDrag = null
}

function valueWhen (activeSlots, id, value) {
  if (activeSlots.includes(id)) {
    return value
  }
}

function dragOver (ev) {
  ev.currentTarget.classList.add('-dragOver')
  if (ev.altKey || containsFiles(ev.dataTransfer)) {
    ev.dataTransfer.dropEffect = 'copy'
  } else {
    ev.dataTransfer.dropEffect = 'move'
  }
  ev.event.preventDefault()
}

function drop (ev) {
  dragLeave(ev)
  ev.event.preventDefault()

  var targetCollection = ev.data.collection
  var targetLookup = targetCollection.context.slotLookup
  var target = targetLookup.get(ev.data.id)

  if (containsFiles(ev.dataTransfer) || ev.dataTransfer.types.includes('loop-drop/sample-path')) {
    var path = ev.dataTransfer.items[0].kind === 'file'
      ? ev.dataTransfer.items[0].getAsFile().path
      : ev.dataTransfer.getData('loop-drop/sample-path')

    if (target) {
      targetCollection.remove(target)
    }

    var node = targetCollection.push({
      id: ev.data.id,
      node: 'slot',
      output: 'output',
      sources: [
        { node: 'source/sample', mode: 'oneshot' }
      ]
    })

    importSample(targetCollection.context, path, function (err, descriptor) {
      var player = node.sources.get(0)
      player.set(extend(player(), descriptor))
      ev.data.select(ev.data.id)
    })
  } else if (ev.dataTransfer.types.includes('loop-drop/source')) {
    var data = JSON.parse(ev.dataTransfer.getData('loop-drop/source'))
    if (!target) {
      target = ev.data.spawnSlot({id: ev.data.id, chunk: ev.data.chunk})
    }
    target.sources.push(data)
  } else if (ev.dataTransfer.types.includes('loop-drop/processor')) {
    var data = JSON.parse(ev.dataTransfer.getData('loop-drop/processor'))
    if (!target) {
      target = ev.data.spawnSlot({id: ev.data.id, chunk: ev.data.chunk})
    }
    target.processors.push(data)
  } else {
    var sourceCollection = currentDrag.collection
    var sourceLookup = sourceCollection.context.slotLookup
    var source = sourceLookup.get(currentDrag.id)
    var isCopying = ev.altKey

    if (source && source !== target) {
      if (target) {
        // clear out existing
        targetCollection.remove(target)
      }

      if (sourceCollection !== targetCollection || isCopying) {
        // move to different collection
        var descriptor = obtainWithId(ev.data.id, source())

        if (!isCopying) {
          sourceCollection.remove(source)
        }

        targetCollection.push(descriptor)
      } else {
        source.id.set(ev.data.id)
      }

      ev.data.select(ev.data.id)
    }
  }
}

function dragLeave (ev) {
  ev.currentTarget.classList.remove('-dragOver')
}

function obtainWithId (id, obj) {
  obj = JSON.parse(JSON.stringify(obj))
  obj.id = id
  return obj
}

function containsFiles (transfer) {
  if (transfer.types) {
    for (var i = 0; i < transfer.types.length; i++) {
      if (transfer.types[i] === 'Files') {
        return true
      }
    }
  }
  return false
}

function eq (a, b) {
  return a === b
}
