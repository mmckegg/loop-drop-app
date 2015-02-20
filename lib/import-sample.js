var join = require('path').join
var getDirectory = require('path').dirname
var getBase = require('path').basename
var getExt = require('path').extname
var getSoundOffset = require('./get-sound-offset.js')
var ObservAudioBuffer = require('loop-drop-project/audio-buffer')

module.exports = importSample

function importSample(context, file, cb){

  var fileObject = context.fileObject
  var project = context.project

  var fileName = getBase(file.name)
  var path = fileObject.resolvePath('./' + fileName)
  var src = project.relative(path)

  project.resolveAvailable(src, function(err, src){
    project.writeFileBlob(src, file, function(err){
      if (err) return cb&&cb(err)

      var path = project.resolve(src)
      var relativeSrc = fileObject.relative(path)

      var obs = ObservAudioBuffer(context)
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