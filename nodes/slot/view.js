var h = require('lib/h')
var Collection = require('lib/widgets/collection')
var Spawner = require('lib/widgets/spawner')
var Range = require('lib/params/range')

module.exports = function renderSlot (node) {
  return h('AudioSlot', [

    // NOTE: this check could be error prone - consider revising?
    checkIsTrigger(node) ? h('section', [
      h('h1', 'Sources'),
      Collection(node.sources),
      Spawner(node.sources, {
        nodes: node.context.nodeInfo.groupLookup.sources.concat(
          node.context.nodeInfo.groupLookup.drumSources
        )
      }),
    ]) : null,

    h('section', [
      h('h1', 'Processors'),
      Collection(node.processors),
      Spawner(node.processors, {
        nodes: node.context.nodeInfo.groupLookup.processors
      })
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
  if (node.context.slotProcessorsOnly) {
    return false
  }
  var data = node()
  var id = data && data.id
  return isFinite(id) || !id || id.$param
}
