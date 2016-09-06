var computed = require('@mmckegg/mutant/computed')
var ObservStruct = require('@mmckegg/mutant/struct')
var Observ = require('@mmckegg/mutant/value')

module.exports = MidiToParam

function MidiToParam (context, id, value) {
  var obs = ObservStruct({
    id: Observ(id)
  })

  obs._type = 'RemoteParam'
  obs.currentValue = computed([value], fromMidi)
  return obs
}

function fromMidi (input) {
  return input / 128
}
