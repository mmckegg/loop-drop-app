var Property = require('observ-default')
var Param = require('audio-slot-param')
var Node = require('observ-node-array/single')
var NodeArray = require('observ-node-array')
var Struct = require('observ-struct')
var BaseChunk = require('lib/base-chunk')
var ExternalRouter = require('lib/external-router')
var lookup = require('observ-node-array/lookup')
var computed = require('observ/computed')
var computedNextTick = require('lib/computed-next-tick')
var ResolvedValue = require('observ-node-array/resolved-value')
var detectPeaks = require('lib/detect-peaks')
var gridSlicePeaks = require('lib/grid-slice-peaks')
var throttle = require('throttle-observ')
var throttleWatch = require('throttle-observ/watch')
var watch = require('observ/watch')
var extend = require('xtend')
var debounce = require('async-debounce')
var applyMixerParams = require('lib/apply-mixer-params')
var destroyAll = require('lib/destroy-all')

module.exports = SlicerChunk

function SlicerChunk (parentContext) {

  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var queueRefreshSlices = noargs(debounce(refreshSlices, 200))

  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    sample: Sample(context),
    eq: EQ(context),

    sliceMode: Property('divide'),
    stretch: Property(false),
    tempo: Property(100),

    outputs: Property(['output']),
    routes: ExternalRouter(context, {output: '$default'}),
    volume: Property(1)
  }, {
    includedAllTriggers: true
  })

  var releaseMixerParams = applyMixerParams(obs)
  obs.overrideVolume = Property(1)

  var volume = computed([obs.volume, obs.overrideVolume], function (a, b) {
    return a * b
  })

  var watchApplied = obs.sample.resolvedBuffer(function (value) {
    if (value) {
      watchApplied()
      setImmediate(function () {
        obs.shape(queueRefreshSlices)
        obs.sample.resolvedBuffer(queueRefreshSlices)
        obs.sliceMode(queueRefreshSlices)
        obs.sample.mode(queueRefreshSlices)
        throttle(obs.sample.offset, 1000)(queueRefreshSlices)

        if (!obs.sample.slices()) { // ensure slices have been generated
          queueRefreshSlices()
        }
      })
    }
  })

   obs.sample.resolvedBuffer(function (value) {
     // without this everything breaks :( no idea why :(
   })

  var computedSlots = computedNextTick([
    obs.sample, obs.stretch, obs.tempo, obs.eq, volume, obs.sample.resolvedBuffer
  ], function (sample, stretch, tempo, eq, volume, buffer) {
    var result = (sample.slices || []).map(function (offset, i) {
      if (stretch && buffer) {

        var originalDuration = getOffsetDuration(buffer.duration, offset)
        var stretchedDuration = tempo / 60 * originalDuration

        return {
          node: 'slot',
          id: String(i),
          output: 'output',
          volume: volume,
          sources: [
            extend(sample, {
              node: 'source/granular',
              mode: 'oneshot',
              attack: 0.1,
              hold: 1,
              release: 0.1,
              duration: stretchedDuration,
              sync: true,
              offset: offset
            })
          ]
        }
      } else {
        return {
          node: 'slot',
          id: String(i),
          output: 'output',
          volume: volume,
          sources: [
            extend(sample, {
              node: 'source/sample',
              mode: 'oneshot',
              offset: offset
            })
          ]
        }
      }

    })

    result.unshift({
      node: 'slot',
      id: 'output',
      processors: [
        extend(eq, {node: 'processor/eq'})
      ]
    })

    return result
  })

  watch(computedSlots, slots.set)
  slots.onUpdate(obs.routes.refresh)

  obs.destroy = function(){
    releaseMixerParams()
    destroyAll(obs)
  }

  obs.resolved = withResolved(obs, ['triggers'])
  return obs

  // scoped
  function refreshSlices (cb) {
    var shape = obs.shape()
    var buffer = obs.sample.resolvedBuffer()
    var sliceMode = obs.sliceMode()
    var triggerMode = obs.sample.mode()
    var offset = obs.sample.offset()
    var count = shape[0] * shape[1]
    var playToEnd = triggerMode === 'full'
    if (sliceMode === 'peak' || sliceMode === 'transient') {
      if (buffer) {
        detectPeaks(buffer.getChannelData(0), count, offset, function (peaks) {
          obs.sample.slices.set(sliceOffsets(peaks, offset, playToEnd))
          cb && cb()
        })
      } else {
        cb && cb()
      }
    } else if (sliceMode === 'snap') {
      if (buffer) {
        gridSlicePeaks(buffer.getChannelData(0), count, offset, function (peaks) {
          obs.sample.slices.set(sliceOffsets(peaks, offset, playToEnd))
          cb && cb()
        })
      } else {
        cb && cb()
      }
    } else {
      obs.sample.slices.set(divideSlices(count, offset, playToEnd))
      cb && setImmediate(cb)
    }
  }

}

function EQ (context) {
  return Struct({
    lowcut: Param(context, 20),
    highcut: Param(context, 20000),
    low: Param(context, 0),
    mid: Param(context, 0),
    high: Param(context, 0)
  })
}

function Sample (context) {
  var obs = Struct({
    offset: Property([0, 1]),
    amp: Param(context, 1),
    transpose: Param(context, 0),
    buffer: Node(context),
    slices: Property(),
    mode: Property('slice')
  })

  obs.context = context
  obs.amp.triggerable = true
  obs.transpose.triggerable = true
  obs.resolvedBuffer = ResolvedValue(obs.buffer)

  return obs
}

function sliceOffsets(slices, offset, playToEnd) {
  if (playToEnd) {
    return slices.map(function (pos) {
      return [pos, offset[1]]
    })
  } else {
    return slices.map(function (pos, i) {
      return [pos, slices[i+1] || offset[1]]
    })
  }
}

function divideSlices(length, offset, playToEnd) {
  var step = 1 / length
  var result = []
  for (var i = 0; i < 1; i += step) {
    result.push(subOffset(offset, [i, playToEnd ? 1 : i+step]))
  }
  return result
}

function subOffset(main, sub) {
  var range = main[1] - main[0]
  return [
    main[0] + (sub[0] * range),
    main[0] + (sub[1] * range)
  ]
}

function getOffsetDuration (duration, offset) {
  return (offset[1] * duration) - (offset[0] * duration)
}

function noargs (fn) {
  return function () {
    fn()
  }
}

function withResolved (obj, keys) {
  var result = computed(keys.map(function (k) { return obj[k] }).concat(obj), function (args) {
    var value = extend(arguments[arguments.length - 1])
    keys.forEach(function (key, i) {
      value[key] = arguments[i]
    })
    return value
  })

  for (var k in obj) {
    if (k !== 'set' && k !== 'destroy') {
      result[k] = obj[k]
    }
  }

  result.node = obj
  return result
}
