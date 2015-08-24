var getExt = require('path').extname
var getBaseName = require('path').basename
var getDirName = require('path').dirname
var join = require('path').join

module.exports = resolveAvailable

function resolveAvailable (path, fs, cb) {
  // check if file exists, 
  // if so increment number and try again
  // otherwise return path

  var ext = getExt(path)
  var base = getBaseName(path, ext)
  var dir = getDirName(path)
  var numberMatch = /(^.+) ([0-9]+)$/.exec(base)

  fs.exists(path, function(exists){
    if (exists){
      if (numberMatch){
        var number = parseInt(numberMatch[2]) + 1
        var fileName = numberMatch[1] + ' ' + number + ext
        resolveAvailable(join(dir, fileName), fs, cb)
      } else {
        var fileName = base + ' 1' + ext
        resolveAvailable(join(dir, fileName), fs, cb)
      }
    } else {
      cb(null, path)
    }
  })
}