var MPE = require('../../../../lib/mouse-position-event.js')

var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var renderGrid = require('./grid.js')
var renderParams = require('./params.js')
var renderLoopPosition = require('./loop-position.js')
var SubLoop = require('../sub-loop.js')

module.exports = function(node){
  if (node){
    var context = node.context
    var collection = context.collection
    
    var state = {node: node}
    var nameSuffix = node().port ? ' (' + node().port + ')' : ''
    return h('div ControllerNode', {
      draggable: true,
      'ev-dragstart': MPE(dragStart, state),
      'ev-dragend': MPE(dragEnd, state),
      'ev-dragover': MPE(dragOver, state)
    }, [
      h('header', [
        h('span', 'Loop Grid' + nameSuffix),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      h('section', [
        renderGrid(node),
        SubLoop(node.playback.loopPosition, renderLoopPosition),
        h('div.controls', renderParams(state.node))
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