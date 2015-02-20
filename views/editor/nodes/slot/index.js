var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Collection = require('../collection.js')
var Spawner = require('../spawner.js')
var Range = require('../../params/range.js')


module.exports = renderSlot

function renderSlot(node){
  var sourceSpawners = node.context.nodes.source._spawners
  var processorSpawners = node.context.nodes.processor._spawners

  return h('AudioSlot', [
    
    checkIsTrigger(node) ? h('section', [
      h('h1', 'Sources'),
      Collection(node.sources),
      Spawner(node.sources, {nodes: sourceSpawners}),
    ]) : null,

    h('section', [
      h('h1', 'Processors'),
      Collection(node.processors),
      Spawner(node.processors, {nodes: processorSpawners})
    ]),

    h('section.options', [
      h('h1', 'Output'),
      Range(node.volume, {
        title: 'volume', 
        flex: true, 
        defaultValue: 1, 
        format: 'dB'
      })
    ]),

  ])
}

function checkIsTrigger(node){
  var data = node()
  var id = data && data.id
  return isFinite(id) || !id
}