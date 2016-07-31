var computed = require('@mmckegg/mutant/computed')

module.exports = FlagParam

function FlagParam (param, flag) {
  var result = computed([param], function (value) {
    return Array.isArray(value) ? !!~value.indexOf(flag) : false
  })

  result.set = function (value) {
    var current = read(param)
    var val = Array.isArray(current) ? current.slice() : []

    var index = val.indexOf(flag)
    var currentState = !!~index
    var newState = !!value

    if (newState !== currentState) {
      if (newState) {
        val.push(flag)
      } else {
        val.splice(index, 1)
      }
    }

    param.set(val)
  }

  result.context = param.context
  return result
}

function read (target) {
  if (typeof target === 'function') {
    return target()
  } else if (target && target.read) {
    return target.read()
  }
}
