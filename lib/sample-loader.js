var join = require('path').join

module.exports = 
function SampleLoader(audioContext, project, sampleRoot){

  var sampleCache = audioContext.sampleCache

  return loadSample

  // scope

  function loadSample(url, cb){
    
    if (!url){
      return cb(new Error('No source specified'))
    }

    var src = join(sampleRoot, url)
    var path = project.resolve(src)

    var current = sampleCache[url]

    if (!current){
      current = sampleCache[url] = []
      requestSample(src, function(err, buffer){
        if (!err){
          sampleCache[url] = buffer
          current.forEach(function(callback){
            callback(buffer)
          })
        } else {
          ;delete sampleCache[url]
        }
      })
    }

    if (cb){
      if (Array.isArray(current)){
        current.push(cb)
      } else {
        cb(current)
      }
    }
  }

  function requestSample(src, cb){
    project.checkExists(src, function(err, exists){
      if (exists){
        project.getFile(src, 'arraybuffer', function(err, file){
          if (err) return cb&&cb(err)
          audioContext.decodeAudioData(file(), function(buffer) {
            cb&&cb(null, buffer)
          }, function(err){
            cb&&cb(err)
          })
        })
      } else {
        cb(new Error('File Not Found'))
      }
    })
  }
}