var h = require('lib/h')
var send = require('mutant/send')
var Collection = require('lib/widgets/collection')
var Spawner = require('lib/widgets/spawner')

var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var ScaleChooser = require('lib/params/scale-chooser')
var Range = require('lib/params/range')
var Editable = require('lib/params/editable')
var assignAvailablePort = require('lib/assign-available-port')

module.exports = renderSetup

function renderSetup (setup) {
  var groupLookup = setup.context.nodeInfo.groupLookup
  var chunkSpawners = [].concat(
    setup.context.nodeInfo.groupLookup.chunks,
    setup.context.nodeInfo.groupLookup.simpleChunks,
    setup.context.nodeInfo.groupLookup.modifierChunks
  )

  return h('SetupNode', [
    h('div.main', [

      h('.controllers NodeCollection -across', [
        h('h1', 'Controllers'),
        Collection(setup.controllers),
        Spawner(setup.controllers, {
          nodes: (groupLookup['loop-grids'] || []).concat(groupLookup['mixers'] || []),
          onSpawn: handleControllerSpawn
        })
      ]),

      h('.chunks NodeCollection', [
        h('h1', [
          'Chunks',
          h('button.condense', {
            'ev-click': send(minimiseAll, setup.chunks)
          })
        ]),
        Collection(setup.chunks),
        Spawner(setup.chunks, {
          nodes: chunkSpawners,
          onSpawn: handleChunkSpawn
        })
      ])

    ]),

    h('div.options', [
      renderScaleChooser(setup.globalScale),
      renderMasterVolume(setup.volume),
      renderOutputSelector(setup),
    ])

  ])
}

function renderOutputSelector(setup) {
  var outputOptions = setup.context.alternateOutputs.map(function (info) {
    return [info.label, info.deviceId]
  })
  var params = [
    Select(QueryParam(setup, 'selectedOutputId'), {
      options: outputOptions,
      flex: true,
      missingPrefix: ' (unknown)'
    })
  ]
  return h('ParamList', params)
}

function renderMasterVolume (volume) {
  return h('section.volume', [
    h('h1', 'Master Volume'),
    h('div.param', [
      Range(volume, {
        format: 'dB',
        flex: true,
        defaultValue: 1
      })
    ])

  ])
}

function renderScaleChooser (scale) {
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

function minimiseAll (items) {
  items.forEach(function (item) {
    if (item.minimised) {
      item.minimised.set(true)
    }
  })
}

function handleControllerSpawn (node) {
  assignAvailablePort(node)
  if (node.grabInput) {
    node.grabInput()
  }
}

function handleChunkSpawn (chunk) {
  Editable.edit(chunk.id)
  chunk.context.setup.selectedChunkId.set(chunk.id())
}
