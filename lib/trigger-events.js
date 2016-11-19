module.exports = function (context, subscribe) {
  var running = false
  var queue = []
  return subscribe((event) => {
    if (event.id) {
      var split = event.id.split('/')
      var chunk = context.chunkLookup.get(split[0])
      var slotId = split[1]

      if (event.time > context.audio.currentTime) {
        queue.push([event, chunk, slotId])
        if (!running) {
          running = true
          setImmediate(flush)
        }
      } else {
        trigger(event, chunk, slotId)
      }
    }
  })

  // scoped

  function flush () {
    running = false
    queue.sort(compare)
    queue.forEach(args => trigger(...args))
    queue.length = 0
  }

  function trigger (event, chunk, slotId) {
    if (chunk) {
      if (event.event === 'start' && (event.triggered || event.time >= context.audio.currentTime - 0.001)) {
        chunk.triggerOn(slotId, event.time)
      } else if (event.event === 'stop') {
        chunk.triggerOff(slotId, event.time)
      }
    }
  }
}

function compare (a, b) {
  return chunkPriority(b[1]) - chunkPriority(a[1]) || a[0].time - b[0].time || eventPriority(b[0]) - eventPriority(a[0])
}

function eventPriority (event) {
  if (event.event === 'stop') {
    return 1
  } else {
    return 0
  }
}

function chunkPriority (chunk) {
  // prioritize modulator chunks
  if (chunk && !chunk.outputs) {
    return 1
  } else {
    return 0
  }
}
