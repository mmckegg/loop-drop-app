var h = require('lib/h')
var map = require('@mmckegg/mutant/map')
var QueryParam = require('lib/query-param')
var ModRange = require('lib/params/mod-range')

module.exports = renderParams

function renderParams (node) {
  var paramValues = QueryParam(node, 'paramValues', {})
  var params = QueryParam(node, 'params')
  return map(params, function (param) {
    return h('ParamList', [
      ModRange(QueryParam(paramValues, param), {
        title: param,
        format: 'ratio1',
        flex: true,
        allowSpawnModulator: true,
        node: node
      })
    ])
  })
}
