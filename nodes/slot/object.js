var Observ = require('mutant/value')
var Slots = require('lib/slots')
var lookup = require('mutant/lookup')
var merge = require('mutant/merge')
var updateParamReferences = require('lib/update-param-references')

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
    modulators: Slots(context),
    sources: Slots(context),
    processors: Slots(context),
    noteOffset: Param(context, 0),
    sustain: Property(true),
    output: Property(null),
    volume: Property(1)
  }, input, output, releases)

  obs.getAttackDuration = function () {
    var duration = 0
    forEachAll([obs.sources, obs.modulators, obs.processors], function (node) {
      if (node && node.getAttackDuration) {
        var value = node.getAttackDuration()
        if (value && (value > duration)) {
          duration = value
        }
      }
    })
    return duration || 0.0001
  }

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

  obs.modulators.onRemove(function (node) {
    if (node && node.id && node.id()) {
      updateParamReferences(obs, node.id(), null)
    }
  })

  context.modulatorLookup = lookup(obs.modulators, 'id')

  context.paramLookup = merge([
    parentContext.paramLookup,
    context.modulatorLookup
  ])

  obs.modulators.resolveAvailable = function (id) {
    var base = id
    var lookup = context.paramLookup()
    var incr = 0

    while (lookup[id]) {
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    return id
  }

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

  obs.processors.onAdd(triggerIfOn)
  obs.modulators.onAdd(triggerIfOn)

  obs.triggerOn = function (at) {
    if (!initialized) {
      queue.push(function () {
        obs.triggerOn(at)
      })
      return false
    }

    var offTime = null

    forEachAll([obs.sources, obs.modulators, obs.processors], function (node) {
      if (node && node.triggerOn) {
        var time = node.triggerOn(at)
        if (time && (!offTime || time > offTime)) {
          offTime = time
        }
      }
    })

    // track off time for immediate triggering of nodes when added
    var onTime = at
    if (!lastTriggerOn || lastTriggerOn < onTime) {
      lastTriggerOn = onTime
    }

    if (offTime) {
      triggerOff(offTime)
    } else if (!obs.sustain()) {
      triggerOff(at + obs.getAttackDuration())
    }
  }

  obs.triggerOff = function (at) {
    if (!obs.sustain()) return // ignore triggerOff

    if (!initialized) {
      queue.push(function () {
        obs.triggerOff(at)
      })
      return false
    }

    triggerOff(at)
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

  function triggerOff (at) {
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

    forEachAll([obs.modulators, obs.processors], function (node) {
      if (node && node.triggerOff) {
        var releaseDuration = node.getReleaseDuration && node.getReleaseDuration() || 0
        offEvents.push([node, releaseDuration, true])
        if (releaseDuration > maxProcessorDuration) {
          maxProcessorDuration = releaseDuration
        }
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

  function triggerIfOn (node) {
    if (isOn() && node.triggerOn) {
      // immediately trigger processors if slot is already triggered
      node.triggerOn(context.audio.currentTime)
    }
  }

  function isOn () {
    return lastTriggerOn && (lastTriggerOn < context.audio.currentTime && (!lastTriggerOff || lastTriggerOff < lastTriggerOn))
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
      for (var i = 0; i < connectedProcessors.length; i++) {
        if (connectedProcessors[i] !== obs.processors.get(i)) {
          return true
        }
      }
    }
  }
}

function forEachAll (collections, iterator) {
  collections.forEach(collection => collection.forEach(iterator))
}
