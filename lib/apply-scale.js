var defaultScale = {
  offset: 0,
  notes: [0, 2, 4, 5, 7, 9, 11]
}

module.exports = applyScale

function applyScale (base, scale) {
  var offset = scale && scale.offset || defaultScale.offset
  var notes = scale && scale.notes || defaultScale.notes
  base = Math.round(base * 100000000) / 100000000 // weed out floating point errors

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
