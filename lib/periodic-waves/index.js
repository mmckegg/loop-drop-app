var raw = require('./raw')

module.exports = function (audioContext) {
  var result = {}
  for (var k in raw) {
    result[k] = audioContext.createPeriodicWave(
      bufferAsFloat32(raw[k].real),
      bufferAsFloat32(raw[k].imag)
    )
  }
  return result
}

module.exports.raw = raw

function bufferAsFloat32 (buffer) {
  return new Float32Array(new Uint8Array(buffer).buffer)
}
