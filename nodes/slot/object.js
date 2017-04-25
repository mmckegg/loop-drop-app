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
  var releases = []
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
  }, input, output, releases)

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
  var lastTriggerOn = null
  var lastTriggerOff = null

  obs.processors.onNodeChange(function () {
    if (!updatingProcessors) {
      setImmediate(updateProcessors)
    }
    updatingProcessors = true
  })

  obs.processors.onAdd(function (node) {
    if (isOn() && node.triggerOn) {
      // immediately trigger processors if slot is already triggered
      node.triggerOn(context.audio.currentTime)
    }
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

    // track off time for immediate triggering of nodes when added
    var onTime = at
    if (!lastTriggerOn || lastTriggerOn < onTime) {
      lastTriggerOn = onTime
    }

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

    // track off time for immediate triggering of nodes when added
    var offTime = at + Math.max(0, difference)
    if (!lastTriggerOff || lastTriggerOff < offTime) {
      lastTriggerOff = offTime
    }
  }

  obs.choke = function (at) {
    obs.sources.forEach(function (source) {
      source.choke && source.choke(at)
    })
  }

  releases.push(
    function () {
      if (isOn()) {
        // force trigger off on removal
        obs.triggerOff(context.audio.currentTime)
      }
    }
  )

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

  function isOn () {
    return (lastTriggerOn < context.audio.currentTime && (!lastTriggerOff || lastTriggerOff < lastTriggerOn))
  }

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
