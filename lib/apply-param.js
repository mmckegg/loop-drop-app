var watch = require('@mmckegg/mutant/watch')

module.exports = ApplyParam

function ApplyParam (context, target, param) {
  var lastValue = null
  return watch(param.currentValue || param, function (value) {
    var at = context.audio.currentTime
    if (value !== lastValue) {
      if (lastValue instanceof global.AudioNode) {
        lastValue.disconnect(target)
      }

      if (typeof value === 'number') {
        if (typeof lastValue === 'number') {
          // dezippering
          target.setValueAtTime(lastValue, at)
          target.linearRampToValueAtTime(value, at + 0.01)
        } else {
          target.setValueAtTime(value, at)
        }
      } else if (value instanceof global.AudioNode) {
        target.setValueAtTime(0, at)
        value.connect(target)
      }
      lastValue = value
    }
  })
}
