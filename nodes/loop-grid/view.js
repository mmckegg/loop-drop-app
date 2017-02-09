var h = require('lib/h')
var send = require('mutant/send')
var when = require('mutant/when')
var computed = require('mutant/computed')

var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var renderGrid = require('./grid.js')

module.exports = function (node) {
  var context = node.context
  var collection = context.collection

  if (node.playback) {
    var nameSuffix = node().port ? ' (' + node().port + ')' : ''
    return h('div ControllerNode', {
      classList: [
        when(node.activeInput, '-input')
      ],
      'ev-click': send(node.grabInput)
    }, [
      h('header', [
        h('span', 'Loop Grid' + nameSuffix),
        h('button.remove Button -warn', {
          'ev-click': send(collection.remove, node)
        }, 'X')
      ]),
      h('section', [
        renderGrid(node),
        renderLoopPosition(node.playback.loopPosition),
        h('div.controls', renderParams(node))
      ])
    ])
  }
}

function renderParams (controller) {
  var spawners = controller.context.nodeInfo.groupLookup['loop-grids']
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

function renderLoopPosition (obs) {
  var loopPosition = computed([obs], x => x[0])
  var loopLength = computed([obs], x => x[1])

  return computed([loopLength], function (loopLength) {
    var positionElements = []
    for (var i = 0; i < loopLength; i++) {
      var active = computed([loopPosition, i], floorEq)
      positionElements.push(
        h('div', {
          classList: when(active, '-active')
        })
      )
    }
    return h('LoopPosition', positionElements)
  })
}

function floorEq (a, b) {
  return Math.floor(a) === Math.floor(b)
}
