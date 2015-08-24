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

  return h('SetupNode', [
    h('div.main', [

      h('.controllers NodeCollection -across', [
        h('h1', 'Controllers'),
        Collection(setup.controllers),
        Spawner(setup.controllers, {nodes: controllerSpawners})
      ]),

      h('.chunks NodeCollection', [
        h('h1', 'Chunks'),
        Collection(setup.chunks),
        ChunkSpawner(setup)
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


function ChunkSpawner(setup){
  var buttons = []

  return h('NodeSpawner', [
    h('button Button -main -spawn', {
      'ev-click': send(spawnTriggers, setup)
    }, '+ Triggers'),

    h('button Button -main -spawn', {
      'ev-click': send(spawnChromatic, setup)
    }, '+ Chromatic'),

    h('button Button -main -spawn', {
      'ev-click': send(spawnModulator, setup)
    }, '+ Modulator')
  ])
}

function spawnTriggers(setup, descriptor, additionalOverrides){
  var context = setup.context
  var actions = context.actions
  var project = context.project
  var fileObject = context.fileObject

  var path = fileObject.resolvePath('New Chunk.json')
  actions.newChunk(path, descriptor, function(err, src){
    var id = setup.chunks.resolveAvailable(getBaseName(src, '.json'))
    var chunk = setup.chunks.push(extend({
      node: 'external',
      src: fileObject.relative(project.resolve(src)),
      id: id,
      minimised: true,
      scale: '$global',
      routes: {output: '$default'}
    }, additionalOverrides))
    setup.selectedChunkId.set(id)
    rename(chunk)
  })
}

function spawnChromatic(setup){
  spawnTriggers(setup, {
    node: 'chunk/scale',
    templateSlot: {
      id: { $param: 'id' },
      noteOffset: {
        node: 'modulator/scale', 
        value: { $param: 'value'}, 
        offset: { $param: 'offset' },  
        scale: { $param: 'scale' }
      },
      node: 'slot', 
      output: 'output'
    },
    selectedSlotId: '$template'
  }, {
    minimised: false
  })
}

function spawnModulator(setup){
  var id = setup.chunks.resolveAvailable('modulator')
  var chunk = setup.chunks.push({
    node: 'modulatorChunk',
    id: id,
    minimised: false
  })
  setup.selectedChunkId.set(id)
  rename(chunk)
}