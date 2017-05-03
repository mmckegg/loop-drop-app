module.exports = isTriggerable

function isTriggerable (param) {
  if (param.triggerable) {
    return true
  } else {
    var slot = param.context && param.context.slot
    return !!(
      slot && slot.triggerOn &&
      slot().id !== 'output' // HACK: should handle this better
    )
  }
}
