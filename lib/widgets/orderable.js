var h = require('lib/h')
var MPE = require('lib/mouse-position-event')

module.exports = Orderable

function Orderable (node, children) {
  return h('Orderable', {
    draggable: true,
    'ev-dragstart': MPE(dragStart, node),
    'ev-dragend': MPE(dragEnd, node),
    'ev-dragover': MPE(dragOver, node)
  }, children)
}

function dragOver (ev) {
  var currentTarget = window.currentDrag
  if (currentTarget && currentTarget.data) {
    var fromCollection = currentTarget.data.context.collection
    var toCollection = ev.data.context.collection

    if (fromCollection === toCollection && ev.data !== currentTarget.data) {
      var index = toCollection.indexOf(ev.data)
      if (~index) {
        toCollection.move(currentTarget.data, index)
      }
    }
  }
}

function dragStart (ev) {
  var node = (ev.data.resolved || ev.data)()
  ev.dataTransfer.setData('loop-drop/' + node.node.split('/')[0], JSON.stringify(node))
  window.currentDrag = ev
}

function dragEnd (ev) {
  if (ev.dataTransfer.dropEffect === 'move') {
    ev.data.context.collection.remove(ev.data)
  }
  window.currentDrag = null
}
