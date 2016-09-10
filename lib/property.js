var Value = require('@mmckegg/mutant/value')

module.exports = function Property (defaultValue) {
  return Value(defaultValue, { defaultValue })
}
