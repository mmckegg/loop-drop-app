var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('lib/params/select')
var range = require('lib/params/range')
var QueryParam = require('loop-drop-setup/query-param')

module.exports = renderRouting

var defaultOutputs = [
  ['Default', '$default'],
  ['Meddler', '$meddler']
]

function renderRouting(node){

  var data = node.resolved()
  var setup = node.context.setup


  if (data){
    var resolvedChunks = setup.resolved.chunks() || []
    var outputOptions = {
      options: defaultOutputs.concat(resolvedChunks.filter(rejectMatchingId, data).reduce(placeChunkInputs, []))
    }

    var routeParams = (data.outputs || []).map(function(outputId){
      return h('div -block', [
        h('div.extTitle', outputId),
        h('div', select(QueryParam(node, ['routes[?]', outputId], {}), outputOptions))
      ])
    })

    return routeParams

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