var h = require('lib/h')
var Collection = require('lib/widgets/collection')
var Spawner = require('lib/widgets/spawner')
var Range = require('lib/params/range')
var ToggleButton = require('lib/params/toggle-button')
var QueryParam = require('lib/query-param')
var ToggleChooser = require('lib/params/toggle-chooser')

module.exports = function renderSlot (node) {
  var modulatorTypes = node.context.nodeInfo.groupLookup.modulators
  if (checkIsTrigger(node)) {
    modulatorTypes = modulatorTypes.concat(
      node.context.nodeInfo.groupLookup.triggerModulators
    )
  }

  return h('AudioSlot', [

    h('section', [
      h('h1', 'Modulators'),
      Collection(node.modulators),
      Spawner(node.modulators, {
        nodes: modulatorTypes
      })
    ]),

    // NOTE: this check could be error prone - consider revising?
    checkIsTrigger(node) ? [
      h('section', [
        h('header', [
          h('h1', 'Sources'),
          ToggleChooser(QueryParam(node, 'chokeGroup'), {
            title: 'Choke Group',
            options: [['None', null], 'A', 'B', 'C', 'D']
          }),
          ToggleButton(node.sustain, {
            title: 'Sustain'
          })
        ]),

        Collection(node.sources),
        Spawner(node.sources, {
          nodes: node.context.nodeInfo.groupLookup.sources.concat(
            node.context.nodeInfo.groupLookup.drumSources
          )
        })
      ])
    ] : null,

    h('section', [
      h('h1', 'Processors'),
      Collection(node.processors),
      Spawner(node.processors, {
        nodes: node.context.nodeInfo.groupLookup.processors
      })
    ]),

    h('section.options', [
      Range(node.volume, {
        title: 'output volume',
        flex: true,
        defaultValue: 1,
        format: 'dB'
      })
    ])
  ])
}

function checkIsTrigger(node){
  if (node.context.slotProcessorsOnly) {
    return false
  }
  var data = node()
  var id = data && data.id
  return isFinite(id) || !id || id.$param
}
