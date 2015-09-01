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

var controllerSpawners = [
  { name: 'MIDI Controller', node: 'controller/launchpad' },
  { name: 'Qwerty Keys', node: 'controller/qwerty' }
]

module.exports = renderSetup

function renderSetup(setup){

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
          nodes: controllerSpawners
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

function handleChunkSpawn (chunk) {
  rename(chunk)
  chunk.context.setup.selectedChunkId.set(chunk().id)
}
