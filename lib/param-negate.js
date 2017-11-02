var Multiply = require('lib/param-multiply')
module.exports = ParamNegate

function ParamNegate (input) {
  return Multiply([input, -1])
}
