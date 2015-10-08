var Transform = require('stream').Transform

module.exports = TimeOutputStream

function TimeOutputStream (offset) {
  offset = offset || 0
  var stream = Transform({ writableObjectMode: true })
  stream._transform = function (data, enc, done) {
    done(null, floatBuffer(data + offset))
  }
  return stream
}

function floatBuffer(value) {
  var buffer = new Buffer(4)
  buffer.writeFloatLE(value, 0)
  return buffer
}
