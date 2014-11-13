var SampleLoader = require('./sample-loader')
var join = require('path').join
var getDirectory = require('path').dirname
var getBase = require('path').basename
var getExt = require('path').extname
var getSoundOffset = require('./get-sound-offset.js')

module.exports = SampleImporter

function SampleImporter(audioContext, project, sampleRoot){
  var loadSample = SampleLoader(audioContext, project, sampleRoot)
  return function importSample(file, cb){
    var fileName = getBase(file.name)
    var src = join(sampleRoot, fileName)
    project.resolveAvailable(src, function(err, src){
      project.writeFileBlob(src, file, function(err){
        if (err) return cb&&cb(err)
        loadSample(fileName, function(buffer){
          cb(null, {
            url: fileName,
            offset: getSoundOffset(buffer) || [0,1]
          })
        })
      })
    })
  }
}
