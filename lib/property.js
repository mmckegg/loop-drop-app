var Value = require('mutant/value')

module.exports = function Property (defaultValue) {
  return Value(defaultValue, { defaultValue })
}
