var fs = require('fs')

writeArray('name.real', input.real)
writeArray('name.imag', input.imag)

function writeArray (file, array) {
  fs.writeFileSync(
    file, new Buffer(new Uint8Array(new Float32Array(array).buffer))
  )
}