var getBase = require('path').basename
var getSoundOffset = require('lib/get-sound-offset')
var resolveAvailable = require('lib/resolve-available')
var copyFile = require('lib/copy-file')

module.exports = importSample

function importSample (context, filePath, cb) {
  var fileObject = context.fileObject

  var fileName = getBase(filePath)
  var from = filePath
  var to = fileObject.resolvePath('./' + fileName)

  if (from === to) {
    // already imported
    console.log('already imported')
    getInfo(context, fileObject, to, cb)
  } else {
    resolveAvailable(to, context.fs, function (err, to) {
      if (err) return cb && cb(err)
      copyFile(from, to, context.fs, function () {
        getInfo(context, fileObject, to, cb)
      })
    })
  }
}

function getInfo (context, fileObject, path, cb) {
  var relativeSrc = fileObject.relative(path)
  var obs = context.nodes.AudioBuffer(context)

  obs.resolved(function (buffer) {
    if (buffer) {
      cb && cb(null, {
        buffer: { node: 'AudioBuffer', src: relativeSrc },
        offset: getSoundOffset(buffer) || [0, 1]
      })

      // destroy after callback to avoid double decode
      obs.destroy()
    }
  })
  obs.set({ src: relativeSrc })
}
