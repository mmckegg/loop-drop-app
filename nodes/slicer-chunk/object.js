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

module.exports = SlicerChunk

function SlicerChunk (parentContext) {

  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    offset: Property([0, 1]),
    amp: Param(context, 1),
    transpose: Param(context, 0),

    lowcut: Param(context, 0),
    highcut: Param(context, 20000),
    low: Param(context, 0),
    mid: Param(context, 0),
    high: Param(context, 0),

    buffer: Node(context),
    outputs: Property(['output']),
    triggerMode: Property('slice'),
    sliceMode: Property('divide'),
    stretch: Property(false),
    tempo: Property(100),
    volume: Property(1),
    routes: ExternalRouter(context)
  })

  obs.resolvedBuffer = ResolvedValue(obs.buffer)

  obs.slices = computedNextTick([obs.shape, obs.resolvedBuffer, throttle(obs.offset, 1000), obs.sliceMode, obs.triggerMode], function (shape, buffer, offset, sliceMode, triggerMode) {
    var count = shape[0] * shape[1]
    var playToEnd = triggerMode === 'full'
    if (sliceMode === 'transient') {
      if (obs.resolvedBuffer()) {
        var data = obs.resolvedBuffer().getChannelData(0)
        var transients = detectTransients(data, count, offset)
        return sliceOffsets(transients, offset, playToEnd)
      }
    }
    return divideSlices(count, offset, playToEnd)
  })

  obs.volume(function(value){
    output.gain.value = value
  })

  var properties = Struct({
    stretch: obs.stretch,
    amp: obs.amp,
    tempo: obs.tempo,
    transpose: obs.transpose,
    buffer: obs.buffer,
    low: obs.low,
    mid: obs.mid,
    high: obs.high,
    highcut: obs.highcut,
    lowcut: obs.lowcut
  })

  obs.amp.triggerable = true
  obs.transpose.triggerable = true
  
  var computedSlots = computed([throttle(properties, 100), obs.slices, obs.resolvedBuffer], function (data, slices, buffer) {

    var result = slices.map(function (offset, i) {
      if (data.stretch && buffer) {

        var originalDuration = getOffsetDuration(buffer.duration, offset)
        var stretchedDuration = data.tempo / 60 * originalDuration

        return {
          node: 'slot',
          id: String(i),
          output: 'output',
          sources: [
            { node: 'source/granular',
              mode: 'oneshot',
              amp: data.amp,
              duration: stretchedDuration,
              sync: true,
              transpose: data.transpose,
              offset: offset,
              buffer: data.buffer
            }
          ]
        }
      } else {
        return {
          node: 'slot',
          id: String(i),
          output: 'output',
          sources: [
            { node: 'source/sample',
              mode: 'oneshot',
              amp: data.amp,
              transpose: data.transpose,
              offset: offset,
              buffer: data.buffer
            }
          ]
        }
      }

    })

    result.push({
      node: 'slot',
      id: 'output',
      processors: [
        { node: 'processor/eq',
          low: data.low,
          mid: data.mid,
          high: data.high,
          highcut: data.highcut,
          lowcut: data.lowcut
        }
      ]
    })

    return result
  })

  throttleWatch(computedSlots, 50, function (value) {
    console.log('thing')
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