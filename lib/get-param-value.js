module.exports = function getParamValue (param, at) {
  if (param.currentValue) {
    var value = param.currentValue()
    if (typeof value === 'number') {
      return value
    } else if (value && value.getValueAtTime && param.context && param.context.audio) {
      return value.getValueAtTime(at || param.context.audio.currentTime)
    } else {
      console.warn('Unable to automate param.', param)
      return 0
    }
  }
}
