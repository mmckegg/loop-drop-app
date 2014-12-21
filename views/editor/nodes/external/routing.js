var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('../../params/select.js')
var range = require('../../params/range.js')
var QueryParam = require('../../../../lib/query-param.js')

module.exports = renderRouting

var defaultOutputs = [
  ['Master', ''],
  ['Meddler', 'meddler']
]

function renderRouting(node, setup, collection){

  var data = node.resolved()

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

    return h('div ParamList', [
      routeParams
    ])

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