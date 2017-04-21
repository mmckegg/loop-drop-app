var PseudoAudioParam = require('pseudo-audio-param')
var Event = require('geval')
var extend = require('xtend')

module.exports = ParamSource

function ParamSource (context, defaultValue) {
  var result = new PseudoAudioParam(defaultValue)
  var insertEvent = result._insertEvent.bind(result) // HACK: monkey patch events
  var cancelScheduledValues = result.cancelScheduledValues.bind(result) // HACK: monkey patch events

  result.context = context

  result.onEvent = Event(function (broadcast) {
    result._insertEvent = function (event) {
      insertEvent(event)
      broadcast(event)
    }
    result.cancelScheduledValues = function (time) {
      cancelScheduledValues(time)
      broadcast({
        type: 'cancelScheduledValues',
        time: time,
        args: [time]
      })
    }
  })

  return result
}

ParamSource.applyEvents = function (audioContext, source, target, at) {
  var maxTime = 0

  var currentTime = audioContext.currentTime
  at = Math.max(at || currentTime, currentTime)
  var number = source.getValueAtTime(at)
  target.value = number

  if (at === currentTime) {
    // with c53 this is needed to make sure that modulators work properly on "reuse" triggers and initial attacks set correctly
    target.setValueAtTime(number, at)
  }

  return source.onEvent((event) => {
    var minTime = audioContext.currentTime
    var args = event.args
    var time = event.time
    if (time < minTime) {
      time = minTime
    }

    if (event.type === 'cancelScheduledValues') {
      target.cancelScheduledValues(time)
      maxTime = event.time
    } else {
      event.args.slice()
      event.args[1] = time

      if (event.type === 'setValueAtTime' && time <= minTime) {
        target.value = event.value
      }

      target[event.type].apply(target, args)
    }

    var sampleTime = event.time
    var duration = 0

    if (event.type === 'setTargetAtTime') {
      duration = event.timeConstant * 8
      sampleTime += duration
    } else if (event.duration) {
      duration = event.duration
    }

    if (sampleTime < maxTime) {
      target.cancelScheduledValues(maxTime)
      target.linearRampToValueAtTime(source.getValueAtTime(maxTime), maxTime)
    }

    if (event.time + duration > maxTime) {
      maxTime = event.time + duration
    }
  })
}

ParamSource.isParam = function (value) {
  return value instanceof PseudoAudioParam || value instanceof ReducedParams
}

ParamSource.reduce = function (params, reducer) {
  return new ReducedParams(params, reducer)
}

function ReducedParams (params, reducer) {
  this.params = params
  this.reducer = reducer
}

ReducedParams.prototype.onEvent = function (listener) {
  var releases = this.params.map(param => ParamSource.isParam(param) && param.onEvent((event) => {
    var duration = 0
    var sampleTime = event.time

    if (event.type === 'setTargetAtTime') {
      duration = event.timeConstant * 8
      sampleTime += duration
    } else if (event.duration) {
      duration = event.duration
    }

    if (event.type === 'cancelScheduledValues') {
      listener(event)
    } else {
      var value = getValueAt(this.params.filter(p => p !== param).concat(event.value), sampleTime, this.reducer)
      var args = event.args.slice()
      args[0] = value
      listener(extend(event, { args, value }))
    }
  }))

  return function () {
    while (releases.length) {
      var fn = releases.pop()
      typeof fn === 'function' && fn()
    }
  }

  // scoped
}

ReducedParams.prototype.getValueAtTime = function (time) {
  return getValueAt(this.params, time, this.reducer)
}

function getValueAt (params, at, reducer) {
  var paramValues = params.map(p => ParamSource.isParam(p) ? p.getValueAtTime(at) : p)
  return reducer(paramValues)
}
