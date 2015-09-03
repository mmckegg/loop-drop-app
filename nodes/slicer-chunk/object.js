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
var detectTransients = require('lib/detect-transients')
var throttle = require('throttle-observ')
var throttleWatch = require('throttle-observ/watch')
var extend = require('xtend')

module.exports = SlicerChunk

function SlicerChunk (parentContext) {

  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

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
  })

  obs.sample.slices = computedNextTick([obs.shape, obs.sample.resolvedBuffer, throttle(obs.sample.offset, 1000), obs.sliceMode, obs.sample.mode], function (shape, buffer, offset, sliceMode, triggerMode) {
    var count = shape[0] * shape[1]
    var playToEnd = triggerMode === 'full'
    if (sliceMode === 'transient') {
      if (buffer) {
        var data = buffer.getChannelData(0)
        var transients = detectTransients(data, count, offset)
        return sliceOffsets(transients, offset, playToEnd)
      }
    }
    return divideSlices(count, offset, playToEnd)
  })

  var computedSlots = computed([
    obs.sample, obs.stretch, obs.tempo, obs.eq, obs.volume, obs.sample.slices, obs.sample.resolvedBuffer
  ], function (sample, stretch, tempo, eq, volume, slices, buffer) {

    var result = slices.map(function (offset, i) {
      if (stretch && buffer) {

        var originalDuration = getOffsetDuration(buffer.duration, offset)
        var stretchedDuration = tempo / 60 * originalDuration

        return {
          node: 'slot',
          id: String(i),
          output: 'output',
          sources: [
            extend(sample, {
              node: 'source/granular',
              mode: 'oneshot',
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

    result.push({
      node: 'slot',
      id: 'output',
      processors: [
        extend(eq, {node: 'processor/eq'})
      ]
    })

    return result
  })

  throttleWatch(computedSlots, 500, function (value) {
    slots.set(value)

    // HACK: bump shape to trigger update of slot mapping
    obs.shape.set(obs.shape())
  })

  slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
  }

  return obs
}

function EQ (context) {
  return Struct({
    lowcut: Param(context, 0),
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
