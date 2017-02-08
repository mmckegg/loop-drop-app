var h = require('lib/h')
var map = require('mutant/map')
var QueryParam = require('lib/query-param')
var ModRange = require('lib/params/mod-range')

module.exports = renderParams

function renderParams (node) {
  return map(node.params, function (param) {
    return h('ParamList', [
      ModRange(QueryParam(node.paramValues, param), {
        title: param,
        format: 'ratio1',
        flex: true,
        allowSpawnModulator: true
      })
    ])
  })
}
