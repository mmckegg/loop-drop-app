var MutantMappedArray = require('mutant/mapped-array')
var Value = require('mutant/value')
var doubleBind = require('lib/double-bind')

module.exports = KeyCollection

function KeyCollection (parentContext) {
  var context = Object.create(parentContext)

  var obs = MutantMappedArray([], item => {
    var key = Value()
    key.context = context
    doubleBind(item, key)
    return key
  })

  context.collection = obs
  obs.context = parentContext

  return obs
}
