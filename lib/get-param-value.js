module.exports = function getParamValue (param) {
  if (param.currentValue) {
    var value = param.currentValue()
    if (typeof value === 'number') {
      return value
    } else {
      console.warn('Unable to automate param.', param)
      return 0
    }
  }
}
