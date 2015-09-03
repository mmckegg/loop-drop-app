var computed = require('observ/computed')

module.exports = function applyParams(obs) {

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

  var raw = {}

  var paramLookup = computed([obs.params, obs.paramValues], function(params, values) {
    var result = {}
    var rawResult = {}
    for (var i=0;i<params.length;i++) {
      var key = params[i]
      result[key] = values && values[key] || 0
      rawResult[key] = obs.paramValues.get(key)
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