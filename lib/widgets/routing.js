var h = require('lib/h')
var select = require('lib/params/select')
var range = require('lib/params/range')
var QueryParam = require('lib/query-param')

module.exports = renderRouting

var defaultOutputs = [
  ['Default', '$default']
]

function renderRouting(node, opts){

  var data = node.resolved && node.resolved() || node()
  var setup = node.context.setup


  if (data){
    var resolvedChunks = setup.resolved.chunks() || []
    var outputOptions = {
      options: defaultOutputs.concat(resolvedChunks.filter(rejectMatchingId, data).reduce(placeChunkInputs, []))
    }

    if (opts && opts.outputOnly) {
      if (outputOptions.length > 1) {
        return select(QueryParam(node, 'routes.output', {}), outputOptions)
      }
    } else {
      return (data.outputs || []).map(function(outputId){
        return h('div -block', [
          h('div.extTitle', outputId),
          h('div', select(QueryParam(node, ['routes[?]', outputId], {}), outputOptions))
        ])
      })
    }
  }

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