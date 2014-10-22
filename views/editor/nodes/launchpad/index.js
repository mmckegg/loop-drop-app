var MPE = require('../../../../lib/mouse-position-event.js')

var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var renderGrid = require('./grid.js')
var renderParams = require('./params.js')
var ControllerWidget = require('../controller-widget.js')

module.exports = function(node, setup, collection){
  if (node && setup && collection){
    var state = {node: node, setup: setup, collection: collection}
    return h('div LaunchpadNode', {
      draggable: true,
      'ev-dragstart': MPE(dragStart, state),
      'ev-dragend': MPE(dragEnd, state),
      'ev-dragover': MPE(dragOver, state)
    }, [
      h('header', [
        h('span', 'Launchpad (' + node().port + ')'),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      h('section', [
        ControllerWidget(renderGrid, node, setup, collection),
        h('div.controls', renderParams(state.node, state.setup))
      ])
    ])
  } else {
    return h('div')
  }
}

function dragOver(ev){
  var currentDrag = window.currentDrag
  if (currentDrag && currentDrag.data.node && currentDrag.data.node !== ev.data.node){
    var index = ev.data.collection.indexOf(ev.data.node)
    if (~index){
      ev.data.collection.move(currentDrag.data.node, index)
    }
  }
}

function dragStart(ev){
  window.currentDrag = ev
}

function dragEnd(ev){
  window.currentDrag = null
}

function invoke(func){
  return func()
}