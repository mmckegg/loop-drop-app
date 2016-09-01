var Transform = require('lib/param-transform')
var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Event = require('geval')

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

  obs.onSchedule = smooth(output.onSchedule)
  obs.getValueAt = output.getValueAt
  obs.destroy = output.destroy

  return obs
}

function smooth (ev) {
  return Event(function (broadcast) {
    ev(function (value) {
      value.duration = 0.1
      value.mode = 'log'
      broadcast(value)
    })
  })
}

function divide(a,b) {
  return a / b
}
