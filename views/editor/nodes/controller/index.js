var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var renderGrid = require('./grid.js')
var renderParams = require('./params.js')
var renderLoopPosition = require('./loop-position.js')
var SubLoop = require('../sub-loop.js')
var ObservClassHook = require('lib/observ-class-hook')

module.exports = function(node){
  if (node){
    var context = node.context
    var collection = context.collection
    
    var state = {node: node}
    var nameSuffix = node().port ? ' (' + node().port + ')' : ''
    return h('div ControllerNode', {
      'ev-class': ObservClassHook(node.activeInput, '-input')
    }, [
      h('header', [
        h('span', 'Loop Grid' + nameSuffix),
        h('button.remove Button -warn', {
          'ev-click': send(collection.remove, node),
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

function invoke(func){
  return func()
}