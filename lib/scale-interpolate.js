module.exports = scaleInterpolate

function scaleInterpolate (currentValue, toValue, state) {
  var difference = absDifference(currentValue, toValue)
  if (difference != null && difference > 3 && (!state.lastSync || Date.now() - state.lastSync > 50)) {
    if (state.interpolatingFrom == null) {
      state.interpolatingFrom = toValue
    }
    if (absDifference(state.interpolatingFrom, currentValue) < difference) {
      if (currentValue <= 0) {
        toValue = 1
      } else {
        toValue = toValue / state.interpolatingFrom * currentValue
      }
    } else {
      state.interpolatingFrom = toValue
      toValue = currentValue
    }
    state.lastSync = null
  } else {
    state.interpolatingFrom = null
    state.lastSync = Date.now()
  }

  return toValue
}

function absDifference (a, b) {
  if (a != null && b != null) {
    return Math.abs(a - b)
  }
}
