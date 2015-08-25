module.exports = function writeHeader(path, header, fs, cb) {
  cb = cb || function (err) {
    if (err) throw err
  }

  var stream = fs.createWriteStream(path, {
    start: 0,
    flags: 'r+'
  })

  stream.on('error', cb)
  stream.on('finish', cb)
  stream.write(header)
  stream.end()
} 
