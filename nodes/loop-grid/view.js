var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var SubLoop = require('lib/sub-loop')
var ObservClassHook = require('lib/observ-class-hook')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')

var renderGrid = require('./grid.js')

var controllerOptions = [
  ['Qwerty Keyboard', 'controller/qwerty'],
  ['Novation Launchpad', 'controller/launchpad'],
  ['Ableton Push', 'controller/push']
]

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

function renderParams(controller){
  var params = [
    Select(QueryParam(controller, 'node'), {
      options: controllerOptions,
      flex: true,
      missingPrefix: ' (unknown)'
    })
  ]

  if (controller.port && controller.portChoices){
    params.push(
      Select(controller.port, {
        options: controller.portChoices,
        flex: true,
        missingPrefix: ' (disconnected)',
        includeBlank: "No Midi Device"
      })
    )
  }

  return h('ParamList', params)
}

function renderLoopPosition(data){
  var positionElements = []

  if (Array.isArray(data)){
    for (var i=0;i<data[1];i++){
      var active = Math.floor(data[0]) == i
      positionElements.push(h('div', {className: active ? '-active' : ''}))
    }
  }

  return h('LoopPosition', positionElements)
}
