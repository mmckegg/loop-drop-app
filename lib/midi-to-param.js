var Transform = require('audio-slot-param/transform')
var ObservStruct = require('observ-struct')
var Observ = require('observ')

module.exports = MidiToParam

function MidiToParam(context, id, value) {
  var obs = ObservStruct({
    id: Observ(id)
  })

  obs._type = 'RemoteParam'

  var output = Transform(context, [
    { param: value },
    { value: 128, transform: divide }
  ])

  obs.onSchedule = output.onSchedule
  obs.getValueAt = output.getValueAt
  obs.destroy = output.destroy

  return obs
}

function divide(a,b) {
  return a / b
}