var computed = require('@mmckegg/mutant/computed')

module.exports = IndexParam

function IndexParam (param, index, formatter) {
  var result = computed([param], function (value) {
    var val = Array.isArray(value) ? value : []
    return val[index]
  })

  result.set = function (value) {
    var current = read(param)
    var val = Array.isArray(current) ? current : []
    var res = val.slice()
    if (typeof formatter === 'function') {
      value = formatter(value)
    }
    res[index] = value
    param.set(res)
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
