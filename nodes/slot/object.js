var Observ = require('mutant/value')
var Slots = require('lib/slots')

var Param = require('lib/param')
var Property = require('lib/property')
var RoutableSlot = require('lib/routable')

module.exports = AudioSlot

function AudioSlot (parentContext, defaultValue) {
  var context = Object.create(parentContext)
  var audioContext = context.audio

  var input = audioContext.createGain()
  var pre = audioContext.createGain()
  var output = audioContext.createGain()

  var toProcessors = audioContext.createGain()
  var post = audioContext.createGain()

  var initialized = false
  var queue = []

  input.connect(pre)
  pre.connect(toProcessors)
  toProcessors.connect(post)
  post.connect(output)

  var obs = RoutableSlot(context, {
    id: Observ(),
    sources: Slots(context),
    processors: Slots(context),
    noteOffset: Param(context, 0),
    output: Property(null),
    volume: Property(1)
  }, input, output)

  obs._type = 'AudioSlot'
  context.noteOffset = obs.noteOffset
  context.slot = obs

  obs.sources.onAdd(function (node) {
    if (node.connect) {
      node.connect(pre)
    }
  })

  obs.sources.onRemove(function (node) {
    if (node.disconnect) {
      node.disconnect(pre)
    }
  })

  // reconnect processors on add / update
  var connectedProcessors = [ toProcessors ]
  var updatingProcessors = false

  obs.processors.onNodeChange(function () {
    if (!updatingProcessors) {
      setImmediate(updateProcessors)
    }
    updatingProcessors = true
  })

  obs.triggerOn = function (at) {
    if (!initialized) {
      queue.push(function () {
        obs.triggerOn(at)
      })
      return false
    }

    var offTime = null

    obs.sources.forEach(function (source) {
      var time = source.triggerOn(at)
      if (time && (!offTime || time > offTime)) {
        offTime = time
      }
    })

    // for processor modulators
    obs.processors.forEach(function (processor) {
      var time = processor && processor.triggerOn(at)
      if (time && (!offTime || time > offTime)) {
        offTime = time
      }
    })

    if (offTime) {
      obs.triggerOff(offTime)
    }

    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    if (!initialized) {
      queue.push(function () {
        obs.triggerOff(at)
      })
      return false
    }

    var maxProcessorDuration = 0
    var maxSourceDuration = 0

    var offEvents = []

    obs.sources.forEach(function (source) {
      var releaseDuration = source.getReleaseDuration && source.getReleaseDuration() || 0
      if (releaseDuration > maxSourceDuration) {
        maxSourceDuration = releaseDuration
      }

      offEvents.push([source, releaseDuration])
    })

    obs.processors.forEach(function (processor) {
      var releaseDuration = processor.getReleaseDuration && processor.getReleaseDuration() || 0
      offEvents.push([processor, releaseDuration, true])
      if (releaseDuration > maxProcessorDuration) {
        maxProcessorDuration = releaseDuration
      }
    })

    var difference = maxProcessorDuration - maxSourceDuration
    var maxDuration = Math.max(maxSourceDuration, maxProcessorDuration)

    offEvents.forEach(function (event) {
      var target = event[0]
      var releaseDuration = event[1]

      if (event[2]) {
        target.triggerOff(at + maxDuration - releaseDuration)
      } else {
        target.triggerOff(at + Math.max(0, difference))
      }
    })

    //not sure if this is right.. :)
    Param.triggerOff(obs, at)
  }

  obs.choke = function (at) {
    obs.sources.forEach(function (source) {
      source.choke && source.choke(at)
    })
  }

  if (defaultValue) {
    obs.set(defaultValue)
  }

  setImmediate(function () {
    initialized = true
    while (queue.length) {
      queue.shift()()
    }
  })

  return obs

  // scoped

  function updateProcessors () {
    if (checkProcessorsChanged()) {
      toProcessors.disconnect()
      while (connectedProcessors.length) {
        connectedProcessors.pop().disconnect()
      }

      var lastProcessor = toProcessors
      obs.processors.forEach(function (processor) {
        if (processor) {
          lastProcessor.connect(processor.input)
          lastProcessor = processor
          connectedProcessors.push(processor)
        }
      })

      lastProcessor.connect(post)
    }

    updatingProcessors = false
  }

  function checkProcessorsChanged () {
    if (connectedProcessors.length !== obs.processors.getLength()) {
      return true
    } else {
      for (var i = 0;i < connectedProcessors.length;i++) {
        if (connectedProcessors[i] !== obs.processors.get(i)) {
          return true
        }
      }
    }
  }
}
