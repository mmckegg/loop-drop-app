var computed = require('@mmckegg/mutant/computed')
var ObservArray = require('observ-array')

module.exports = function extendParams (obs) {
  // HACK: make ring modulator effect work on output channel
  var triggeredSlots = []
  obs.slots(function (slots) {
    obs.slots.forEach(function (slot) {
      var id = slot.id()
      if (!isFinite(id) && !~triggeredSlots.indexOf(id)) {
        triggeredSlots.push(slot.id)
        slot.triggerOn(obs.context.audio.currentTime)
      }
    })
  })

  var paramOverrideStack = ObservArray([])
  obs.overrideParams = function (params) {
    paramOverrideStack.push(params)
    return function release () {
      var index = paramOverrideStack.indexOf(params)
      if (~index) {
        paramOverrideStack.splice(index, 1)
      }
    }
  }

  var raw = {}

  var paramLookup = computed([obs.params, obs.paramValues, paramOverrideStack], function (params, values, overrides) {
    var result = {}
    var rawResult = {}
    for (var i = 0; i < params.length; i++) {
      var key = params[i]
      var override = paramOverrideStack.get(paramOverrideStack.getLength() - 1)
      if (override && override[i] != null) {
        result[key] = typeof override[i] === 'function' ? override[i]() : override[i] || 0
        rawResult[key] = override[i]
      } else {
        result[key] = values && values[key] || 0
        rawResult[key] = obs.paramValues.get(key)
      }
    }
    raw = rawResult
    return result
  })

  paramLookup.get = function(key) {
    return raw[key]
  }

  paramLookup.keys = function(key) {
    return Object.keys(raw)
  }

  obs.context.paramLookup = paramLookup

  obs.resolveAvailableParam = function(id){
    var base = id
    var items = obs.params()
    var incr = 0

    while (~items.indexOf(id)){
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    return id
  }
}
