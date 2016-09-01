var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('observ-struct')
var Prop = require('observ-default')

var Param = require('lib/param')
var ParamProxy = require('lib/param-proxy')
var Transform = require('lib/param-transform')

module.exports = LinkParam

function LinkParam (context) {
  var obs = ObservStruct({
    param: Observ(),
    minValue: Param(context, 0),
    maxValue: Param(context, 1),
    mode: Prop('linear'),
    quantize: Prop(0)
  })

  obs.value = ParamProxy(context, 0)
  obs._type = 'LinkParam'
  obs.context = context

  var updating = false
  var releaseParams = null
  var onDestroy = []

  // transform: value * (maxValue - minValue) + minValue
  var outputValue = Transform(context, [
    { param: obs.mode },
    { param: obs.value, transform: applyInterpolation },
    { param: Transform(context,
      [ { param: obs.maxValue },
        { param: obs.minValue, transform: subtract }
      ]), transform: multiply
    },
    { param: obs.minValue, transform: add },
    { param: obs.quantize, transform: quantize }
  ])

  obs.onSchedule = outputValue.onSchedule
  obs.getValueAt = outputValue.getValueAt

  obs.getValue = function () {
    return outputValue.getValueAt(context.audio.currentTime)
  }

  if (context.paramLookup) {
    releaseParams = context.paramLookup(handleUpdate)
  }

  if (context.active) {
    onDestroy.push(context.active(handleUpdate))
  }

  obs.param(handleUpdate)

  obs.destroy = function () {
    while (onDestroy.length) {
      onDestroy.pop()()
    }
    releaseParams && releaseParams()
    releaseParams = null
    obs.value.destroy()
  }

  return obs

  // scoped

  function updateNow () {
    if (!context.active || context.active()) {
      var param = context.paramLookup.get(obs.param())
      obs.value.setTarget(param)
    } else {
      obs.value.setTarget(null)
    }
    updating = false
  }

  function handleUpdate () {
    if (!updating) {
      updating = true
      setImmediate(updateNow)
    }
  }

  function applyInterpolation (mode, value) {
    if (mode === 'exp') {
      if (obs.minValue() < obs.maxValue()) {
        return value * value
      } else {
        var i = 1 - value
        return 1 - (i * i)
      }
    } else { // linear
      return value
    }
  }
}

function quantize (value, grid) {
  if (grid) {
    return Math.round(value * grid) / grid
  } else {
    return value
  }
}

// transform operations
function add (a, b) { return a + b }
function subtract (a, b) { return a - b }
function multiply (a, b) { return a * b }
