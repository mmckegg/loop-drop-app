var toArrayBuffer = require('to-arraybuffer')
var worker = new window.Worker('file://' + __dirname + '/worker/pcm-reinterleaver.js')

module.exports = reinterleavePcm

function reinterleavePcm (stream, opts, cb) {

  worker.postMessage(opts)
  worker.onmessage = function (e) {
    cb(null, e.data.outputs.map(x => Buffer.from(x.buffer)))
  }

  stream.on('data', function (buffer) {
    var view = getTypedArray(buffer)
    worker.postMessage(view, [view.buffer])
  }).on('finish', function () {
    worker.close()
  })

  stream.resume()

  stream.on('error', function (error) {
    cb(error)
  })
}

function getTypedArray (buffer, bitDepth) {
  return bitDepth === 32
    ? new Float32Array(toArrayBuffer(buffer))
    : new Int16Array(toArrayBuffer(buffer))
}
