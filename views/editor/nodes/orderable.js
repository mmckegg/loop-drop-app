var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var MPE = require('../../../lib/mouse-position-event.js')

module.exports = Orderable

function Orderable(node, children){
  return h('Orderable', {
    draggable: true,
    'ev-dragstart': MPE(dragStart, node),
    'ev-dragend': MPE(dragEnd, node),
    'ev-dragover': MPE(dragOver, node)
  }, children)
}

function dragOver(ev){
  var currentTarget = window.currentDrag
  if (currentTarget && currentTarget.data){
    var fromCollection = currentTarget.data.context.collection
    var toCollection = ev.data.context.collection

    if (fromCollection === toCollection && ev.data !== currentTarget.data){
      var index = toCollection.indexOf(ev.data)
      if (~index){
        toCollection.move(currentTarget.data, index)
      }
    }
  }
}

function dragStart(ev){
  window.currentDrag = ev
}

function dragEnd(ev){
  window.currentDrag = null
}