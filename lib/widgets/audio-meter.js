var h = require('lib/h')
var watch = require('@mmckegg/mutant/watch')
var Value = require('@mmckegg/mutant/value')

module.exports = function (value, opts) {
  var element = h('AudioMeter', [
    h('div.left', getElements(opts)),
    h('div.right', getElements(opts))
  ])

  var lastL = 0
  var lastR = 0

  var release = watch(value, function (val) {
    var current = value() || [opts.min, opts.min]
    var l = abs(current[0], opts)
    var r = abs(current[1], opts)
    updateActive(element.childNodes[0].childNodes, l, lastL)
    updateActive(element.childNodes[1].childNodes, r, lastR)
    lastL = l
    lastR = r
  })

  var obs = Value(element)

  obs.destroy = function () {
    h.destroy(element)
    release()
  }

  return obs
}

function getElements (options) {
  var result = []
  var range = options.max - options.min
  var step = range / options.steps
  for (var i = options.min; i < options.max; i += step) {
    if (i >= options.red) {
      result.push(h('div -red'))
    } else if (i >= options.amber) {
      result.push(h('div -amber'))
    } else {
      result.push(h('div'))
    }
  }
  return result
}

function updateActive (nodes, current, last) {
  if (current > last) {
    for (var i = last; i <= current; i++) {
      nodes[i].classList.add('-active')
    }
  } else {
    for (var i = current; i <= last; i++) {
      nodes[i].classList.remove('-active')
    }
  }
}

function abs (value, options) {
  return Math.min(Math.max(Math.floor((value - options.min) * options.steps / (options.max - options.min)), 0), options.steps - 1)
}
