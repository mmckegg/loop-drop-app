var h = require('lib/h')
var SelectWidget = require('lib/widgets/select')
var QueryParam = require('lib/query-param')
var spawnNode = require('lib/spawn-node')
var setRoute = require('lib/set-route')
var read = require('lib/read')
var map = require('@mmckegg/mutant/map')
var computed = require('@mmckegg/mutant/computed')
var concat = require('@mmckegg/mutant/concat')
var Value = require('@mmckegg/mutant/value')

module.exports = function (node) {
  var setup = node.context.setup

  var defaultOptions = [
    h('option', {rawValue: '$default'}, 'Default'),
    h('option', {rawValue: Value(spawnMeddler)}, '+ Create New Meddler')
  ]

  var outputOptions = map(setup.chunks, function (chunk) {
    return computed([chunk.resolved || chunk, node.id], function (chunk, id) {
      if (chunk && chunk.id !== id && chunk.inputs && chunk.inputs.length) {
        return h('optgroup', {label: chunk.id}, chunk.inputs.map(name => option(chunk.id, name)))
      }
    })
  })

  var value = computed(node.resolved || node, function (data) {
    return data && data.routes && data.routes['output'] || '$default'
  })

  return h('div -block', [
    h('div.extTitle', 'output'),
    h('div', SelectWidget(handleSelect, { node: node, id: 'output' }, {
      options: concat([defaultOptions, outputOptions]),
      selectedValue: value
    }))
  ])
}

function handleSelect (value) {
  if (typeof value === 'function') {
    value(this.data)
  } else {
    var node = this.data.node
    setRoute(node, this.data.id, value)
  }
}

function spawnMeddler (data) {
  var setup = data.node.context.setup
  var actions = data.node.context.actions
  var index = setup.chunks.indexOf(data.node) + 1 || undefined
  spawnNode(setup.chunks, 'chunk/meddler', index, function (err, chunk) {
    var newId = setup.chunks.resolveAvailable(data.node().id + '-' + (data.id || 'meddler'))
    var idParam = chunk.id || QueryParam(chunk, 'id')
    var originalId = read(idParam)
    idParam.set(newId)
    actions.updateChunkReferences(originalId, newId, chunk)
    setup.selectedChunkId.set(newId)
    setRoute(data.node, data.id, newId + '#input')
  })
}

function option (chunkId, id) {
  return h('option', {rawValue: chunkId + '#' + id}, chunkId + ' > ' + id)
}
