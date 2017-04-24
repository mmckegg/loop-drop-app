var resolve = require('mutant/resolve')
var ParamSource = require('lib/param-source')

module.exports = ValueAtTimeGetter

function ValueAtTimeGetter (nodes, numberResult, reducer) {
  return function getValueAtTime (time) {
    var values = resolve(nodes).map(x => x.getValueAtTime && x.getValueAtTime(time) || 0)
    var numberValue = resolve(numberResult)
    if (ParamSource.isParam(numberValue)) {
      numberValue = numberValue.getValueAtTime(time)
    }
    if (typeof numberValue === 'number') {
      values = values.concat(numberValue)
    }
    return reducer(values)
  }
}
