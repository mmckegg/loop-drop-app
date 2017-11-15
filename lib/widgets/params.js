var h = require('lib/h')
var map = require('mutant/map')
var ModRange = require('lib/params/mod-range')
var computed = require('mutant/computed')

module.exports = renderParams

function renderParams (node) {
  var paramNames = computed([node.params], (params) => params)
  return map(paramNames, function (paramName) {
    var param = node.paramValues.get(paramName)
    if (!param) {
      // ensure that it exists for backwards compat with old setups
      param = node.paramValues.put(paramName, 0)
    }
    return h('ParamList', [
      ModRange(param, {
        title: paramName,
        format: 'ratio1',
        flex: true,
        allowSpawnModulator: true
      })
    ])
  })
}
