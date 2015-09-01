var h = require('lib/h')
var QueryParam = require('lib/query-param')
var ModRange = require('lib/params/mod-range')

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
          flex: true,
          allowSpawn: true,
          node: node
        })
      ])
    })
  }
}
