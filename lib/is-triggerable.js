module.exports = isTriggerable

function isTriggerable (param) {
  if (typeof param.triggerable === 'boolean') {
    return param.triggerable
  } else {
    var slot = param.context && param.context.slot
    return !!(
      slot && slot.triggerOn &&
      slot().id !== 'output' // HACK: should handle this better
    )
  }
}
