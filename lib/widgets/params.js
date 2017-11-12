var h = require('lib/h')
var map = require('mutant/map')
var ModRange = require('lib/params/mod-range')
var computed = require('mutant/computed')

module.exports = renderParams

function renderParams (node) {
  var paramNames = computed([node.params, node.paramValues], (params, paramValues) => {
    return params.filter(x => x in paramValues)
  })

  return map(paramNames, function (paramName) {
    var param = node.paramValues.get(paramName)
    if (param) {
      return h('ParamList', [
        ModRange(param, {
          title: paramName,
          format: 'ratio1',
          flex: true,
          allowSpawnModulator: true
        })
      ])
    }
  })
}
