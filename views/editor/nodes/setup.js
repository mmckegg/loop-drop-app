var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Collection = require('./collection.js')
var Spawner = require('./spawner.js')

var ScaleChooser = require('../params/scale-chooser.js')
var Range = require('../params/range.js')
var QueryParam = require('loop-drop-setup/query-param')

module.exports = renderSetup

function renderSetup(setup){
  var controllerSpawners = setup.context.nodes.controller._spawners
  return h('SetupNode', [
    h('.main', [
      h('NodeCollection -across', [
        h('h1', 'Controllers'),
        Collection(setup.controllers),
        Spawner(setup.controllers, {nodes: controllerSpawners})
      ]),

      renderScaleChooser(setup.globalScale)
    ]),


    h('.chunks NodeCollection', [
      h('h1', 'Chunks'),
      Collection(setup.chunks)
    ])
  ])
}

function renderScaleChooser(scale){
  return h('section ExternalNode', [

    h('header', [
      h('h1', 'Global Scale'),
      Range(QueryParam(scale, 'offset', {}), {
        title: 'offset', 
        format: 'semitone', 
        defaultValue: 0, 
        flex: 'small',
        width: 200
      })
    ]),

    h('section', [
      ScaleChooser(QueryParam(scale, 'notes', {}))
    ])

  ])
}