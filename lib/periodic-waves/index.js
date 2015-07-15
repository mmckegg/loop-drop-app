var fs = require('fs')
var path = require('path')

var raw = {}

fs.readdirSync(__dirname).forEach(function(file) {
  var ext = path.extname(file)
  if (ext === '.imag' || ext === '.real') {
    var base = path.basename(file, ext)
    var item = raw[base] = raw[base] || {}
    item[ext.slice(1)] = bufferAsFloat32(fs.readFileSync(path.join(__dirname, file)))
  }
})

function bufferAsFloat32 (buffer) {
  return new Float32Array(new Uint8Array(buffer).buffer)
}

module.exports = function (audioContext) {
  var result = {}
  for (var k in raw) {
    result[k] = audioContext.createPeriodicWave(raw[k].real, raw[k].imag)
  }
  return result
}

module.exports.raw = raw