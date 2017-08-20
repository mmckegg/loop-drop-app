module.exports = function getParamValue (param) {
  if (param.currentValue) {
    var value = param.currentValue()
    if (typeof value === 'number') {
      return value
    } else if (value && value.getValueAtTime && param.context && param.context.audio) {
      return value.getValueAtTime(param.context.audio.currentTime)
    } else {
      console.warn('Unable to automate param.', param)
      return 0
    }
  }
}
