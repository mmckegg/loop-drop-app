var ObservStruct = require('observ-struct')
var Property = require('observ-default')

var Param = require('lib/param')
var Transform = require('lib/param-transform')

module.exports = ScaleModulator

var defaultScale = {
  offset: 0,
  notes: [0, 2, 4, 5, 7, 9, 11]
}

function ScaleModulator (context) {
  var obs = ObservStruct({
    value: Param(context, 0),
    scale: Property(defaultScale)
  })

  var transformedValue = Transform(context, [
    { param: obs.value },
    { param: context.offset, transform: add },
    { param: obs.scale, transform: applyScale }
  ])

  obs.onSchedule = transformedValue.onSchedule
  obs.getValueAt = transformedValue.getValueAt

  return obs
}

function add (base, value) {
  return base + value
}

function applyScale (base, scale) {
  var offset = scale && scale.offset || defaultScale.offset
  var notes = scale && scale.notes || defaultScale.notes

  var multiplier = Math.floor(base / notes.length)
  var scalePosition = mod(base, notes.length)
  var absScalePosition = Math.floor(scalePosition)
  var fraction = scalePosition - absScalePosition

  var note = notes[absScalePosition] + offset

  if (fraction) {
    var interval = getInterval(absScalePosition, notes)
    return note + (interval * fraction) + (multiplier * 12)
  } else {
    return note + (multiplier * 12)
  }
}

function getInterval (current, notes) {
  if (current >= notes.length - 1) {
    return 12 + notes[0] - notes[current]
  } else {
    return notes[current + 1] - notes[current]
  }
}

function mod (n, m) {
  return ((n % m) + m) % m
}
