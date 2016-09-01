var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('observ-struct')
var Event = require('geval')

var Param = require('audio-slot-param')
var Transform = require('audio-slot-param/transform')

module.exports = ParamModulator

function ParamModulator (context) {
  var obs = ObservStruct({
    param: Observ(),
    value: Param(context, 0)
  })

  obs._type = 'ParamModulator'

  obs.context = context

  var currentParam = null

  var releaseSchedule = null
  var releaseParams = null

  var handleSchedule = null

  var eventSource = {
    onSchedule: Event(function (broadcast) {
      handleSchedule = broadcast
    }),
    getValueAt: function (at) {
      if (typeof currentParam === 'number') {
        return currentParam
      } else if (currentParam && currentParam.getValueAt) {
        return currentParam.getValueAt(at)
      } else {
        return 0
      }
    }
  }

  var transformedValue = Transform(context, [
    { param: obs.value },
    { param: eventSource, transform: operation }
  ])

  obs.onSchedule = transformedValue.onSchedule
  obs.getValueAt = transformedValue.getValueAt

  if (context.paramLookup) {
    releaseParams = context.paramLookup(handleUpdate)
  }

  obs.param(handleUpdate)

  setImmediate(transformedValue.resend)

  obs.destroy = function () {
    releaseParams && releaseParams()
    releaseSchedule && releaseSchedule()
    releaseSchedule = releaseParams = null
  }

  return obs

  // scale

  function handleUpdate () {
    var param = context.paramLookup.get(obs.param())
    if (currentParam !== param) {
      releaseSchedule && releaseSchedule()
      releaseSchedule = null
      if (param) {
        if (param.onSchedule) {
          releaseSchedule = param.onSchedule(handleSchedule)
        } else if (typeof param === 'function') {
          releaseSchedule = param(function (value) {
            handleSchedule({
              value: value,
              at: context.audio.currentTime
            })
          })
        }
      }
    }
    currentParam = param
  }

  function operation (base, value) {
    return base + value
  }

}
