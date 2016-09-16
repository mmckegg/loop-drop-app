var callbacks = {}
var worker = null
var count = 0

module.exports = toPcm

function toPcm (channelData, cb) {
  initWorker()
  callbacks[count] = cb
  worker.postMessage({channelData, id: count})
  count += 1
}

function initWorker () {
  if (!worker) {
    worker = new global.Worker(global.URL.createObjectURL(
      new global.Blob([`(${WorkerProcess.toString()})(this)`])
    ))
    worker.onmessage = function (e) {
      if (callbacks[e.data.id]) {
        callbacks[e.data.id](null, Buffer.from(e.data.result.buffer))
        delete callbacks[e.data.id]
      }
    }
  }
}

function WorkerProcess (worker) {
  worker.onmessage = function (e) {
    var id = e.data.id
    var channelData = e.data.channelData
    var channelCount = channelData.length
    var sampleCount = channelData[0].length

    var result = new Float32Array(channelCount * sampleCount)

    for (var i = 0; i < sampleCount; i++) {
      for (var c = 0; c < channelCount; c++) {
        result[i * channelCount + c] = channelData[c][i]
      }
    }

    worker.postMessage({result, id}, [ result.buffer ])
  }
}
