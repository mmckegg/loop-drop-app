var h = require('lib/h')
var send = require('value-event/event')
var Collection = require('lib/widgets/collection')
var Spawner = require('lib/widgets/spawner')
var getBaseName = require('path').basename

var QueryParam = require('lib/query-param')
var ScaleChooser = require('lib/params/scale-chooser')
var Range = require('lib/params/range')
var rename = require('lib/rename-hook').rename
var extend = require('xtend')

module.exports = renderSetup

function renderSetup (setup) {
  var groupLookup = setup.context.nodeInfo.groupLookup
  var chunkSpawners = [].concat(
    setup.context.nodeInfo.groupLookup.chunks,
    setup.context.nodeInfo.groupLookup.modifierChunks
  )

  return h('SetupNode', [
    h('div.main', [

      h('.controllers NodeCollection -across', [
        h('h1', 'Controllers'),
        Collection(setup.controllers),
        Spawner(setup.controllers, {
          nodes: groupLookup['loop-grids'].concat(groupLookup['mixers']),
          onSpawn: handleControllerSpawn
        })
      ]),

      h('.chunks NodeCollection', [
        h('h1', 'Chunks'),
        Collection(setup.chunks),
        Spawner(setup.chunks, {
          nodes: chunkSpawners,
          onSpawn: handleChunkSpawn
        })
      ])

    ]),

    h('div.options', [
      renderScaleChooser(setup.globalScale),
      renderMasterVolume(setup.volume)
    ])

  ])
}

function renderMasterVolume(volume){
  return h('section.volume', [

    h('h1', 'Master Volume'),
    h('div.param', [
      Range(volume, {
        format: 'dB',
        flex: true
      })
    ])

  ])
}

function renderScaleChooser(scale){
  return h('section.scale', [
    h('h1', 'Global Scale'),
    h('div.chooser', [
      ScaleChooser(QueryParam(scale, 'notes', {}))
    ]),
    h('div.param', [
      Range(QueryParam(scale, 'offset', {}), {
        title: 'offset',
        format: 'semitone',
        defaultValue: 0,
        flex: true,
        width: 200
      })
    ])
  ])
}

function handleControllerSpawn (node) {
  assignAvailablePort(node)
  if (node.grabInput) {
    node.grabInput()
  }
}

function handleChunkSpawn (chunk) {
  setTimeout(function () {
    rename(chunk)
  }, 100)
  chunk.context.setup.selectedChunkId.set(chunk().id)
}

function assignAvailablePort (node) {
  var nodeInfo = node.context.nodeInfo.lookup[node().node]
  if (nodeInfo && node.port && nodeInfo.portMatch) {
    var availablePorts = node.context.midiPorts().filter(function (name) {
      return nodeInfo.portMatch.exec(name)
    })

    var usedPorts = node.context.collection.map(function (controller) {
      return controller.port && controller.port()
    }).filter(function (name) {
      return availablePorts.includes(name)
    })

    var portName = getRarest(availablePorts.concat(usedPorts))
    node.port.set(portName)
  }
}

function getRarest (array) {
  var ranked = array.reduce(function (result, item) {
    result[item] = (result[item] || 0) + 1
    return result
  }, {})

  return Object.keys(ranked).sort(function (a, b) {
    return ranked[a] - ranked[b]
  })[0]
}
