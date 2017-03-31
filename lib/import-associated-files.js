var resolvePath = require('path').resolve
var fs = require('fs')
var each = require('async-each')

module.exports = function (descriptor, originalDirectory, targetDirectory, cb) {
  each(getFiles(descriptor), (file, next) => {
    var from = resolvePath(originalDirectory, file)
    var to = resolvePath(targetDirectory, file)
    fs.exists(from, (exists) => {
      if (exists) {
        fs.exists(to, (exists) => {
          if (!exists) {
            copyFile(from, to, next)
          } else {
            next()
          }
        })
      } else {
        next()
      }
    })
  }, cb)
}

function copyFile (from, to, cb) {
  fs.createReadStream(from).pipe(fs.createWriteStream(to)).on('finish', cb)
}

function getFiles (descriptor) {
  var result = []
  JSON.stringify(descriptor, function (key, value) {
    if (value && (value.node === 'AudioBuffer')) {
      result.push(value.src)
    }
    return value
  })
  return result
}
