var h = require('lib/h')
var QueryParam = require('loop-drop-project/query-param')

module.exports = renderParams

function renderParams(node) {
  var paramValues = QueryParam(node, 'paramValues', {})
  var params = QueryParam(node, 'params').read()
  if (params instanceof Array) {
    return params.map(function(key) {
      return h('ParamList', [
        ModRange(QueryParam(paramValues, key), {
          title: key,
          format: 'ratio1', 
          flex: true
        })
      ])
    })
  }
}