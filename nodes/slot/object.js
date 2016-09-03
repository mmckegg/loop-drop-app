var Observ = require('@mmckegg/mutant/value')
var NodeArray = require('observ-node-array')

var Param = require('lib/param')
var Property = require('observ-default')
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
    sources: NodeArray(context),
    processors: NodeArray(context),
    noteOffset: Param(context, 0),
    output: Observ(),
    volume: Property(1)
  }, input, output)

  obs._type = 'AudioSlot'
  context.noteOffset = obs.noteOffset
  context.slot = obs

  // reconnect sources on add / update
  var connectedSources = []
  obs.sources.onUpdate(function (diff) {
    while (connectedSources.length) {
      connectedSources.pop().disconnect()
    }
    obs.sources.forEach(function (source) {
      source.connect(pre)
      connectedSources.push(source)
    })
  })

  // reconnect processors on add / update
  var connectedProcessors = [ toProcessors ]
  var updatingProcessors = false

  obs.processors.onUpdate(function (diff) {
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
        }
        connectedProcessors.push(processor)
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
