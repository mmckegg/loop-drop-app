var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var SubLoop = require('lib/sub-loop')
var ObservClassHook = require('lib/observ-class-hook')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')

module.exports = function (node) {
  if (node) {
    var context = node.context
    var collection = context.collection

    var state = {node: node}
    var nameSuffix = node().port ? ' (' + node().port + ')' : ''
    return h('div ControllerNode', {
      'ev-class': ObservClassHook(node.activeInput, '-input')
    }, [
      h('header', [
        h('span', 'Mixer' + nameSuffix),
        h('button.remove Button -warn', {
          'ev-click': send(collection.remove, node)
        }, 'X')
      ]),
      h('section', [
        h('div.controls', renderParams(state.node))
      ])
    ])
  } else {
    return h('div')
  }
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
