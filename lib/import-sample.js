var join = require('path').join
var getDirectory = require('path').dirname
var getBase = require('path').basename
var getExt = require('path').extname
var getSoundOffset = require('./get-sound-offset.js')
var resolveAvailable = require('lib/resolve-available')
var copyFile = require('lib/copy-file')

module.exports = importSample

function importSample(context, file, cb){

  var fileObject = context.fileObject
  var project = context.project

  var fileName = getBase(file.name)
  var from = file.path
  var to = fileObject.resolvePath('./' + fileName)

  resolveAvailable(to, context.fs, function (err, to) {

    copyFile(from, to, context.fs, function () {

      var relativeSrc = fileObject.relative(to)
      var obs = context.nodes.AudioBuffer(context)

      obs.resolved(function(buffer){
        if (buffer){
          cb&&cb(null, {
            buffer: { node: 'AudioBuffer', src: relativeSrc },
            offset: getSoundOffset(buffer) || [0,1]
          })

          // destroy after callback to avoid double decode
          obs.destroy()
        }
      })
      obs.set({ src: relativeSrc })
    })

  })
}