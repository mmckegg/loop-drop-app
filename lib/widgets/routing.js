var h = require('lib/h')
var SelectWidget = require('lib/widgets/select')
var QueryParam = require('lib/query-param')
var spawnNode = require('lib/spawn-node')
var SubLoop = require('lib/sub-loop')
var setRoute = require('lib/set-route')
var read = require('lib/read')

var defaultOutputs = [
  ['Default', '$default'],
  ['+ Create New Meddler', spawnMeddler]
]

module.exports = function (node) {
  var setup = node.context.setup
  return SubLoop([node, setup.resolved.chunks, node.resolved], renderRouting)
}

function renderRouting (node, resolvedChunks) {
  var data = node.resolved && node.resolved() || node()
  if (data) {
    var outputOptions = defaultOutputs.concat(resolvedChunks().filter(rejectMatchingId, data).reduce(placeChunkInputs, []))
    return h('div -block', [
      h('div.extTitle', 'output'),
      h('div', SelectWidget(handleSelect, { node: node, id: 'output' }, {
        options: outputOptions,
        selectedValue: data.routes && data.routes['output'] || '$default'
      }))
    ])
  }
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
  var index = setup.chunks.indexOf(data.node) + 1 || undefined
  spawnNode(setup.chunks, 'chunk/meddler', index, function (err, chunk) {
    var newId = setup.chunks.resolveAvailable(data.node().id + '-' + (data.id || 'meddler'))
    var idParam = chunk.id || QueryParam(chunk, 'id')
    idParam.set(newId)
    setup.selectedChunkId.set(newId)
    setRoute(data.node, data.id, newId + '#input')
  })
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

function rejectMatchingId(item){
  return item && this.id !== item.id
}

function placeChunkInputs(result, chunk){
  if (chunk && chunk.inputs && chunk.inputs.length){
    result.push([chunk.id, chunk.inputs.map(titleWithResolvedId, chunk)])
  }
  return result
}

function titleWithResolvedId(id){
  return [this.id + ' > ' + id, this.id + '#' + id]
}
