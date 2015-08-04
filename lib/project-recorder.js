var ObservStruct = require('observ-struct')
var Observ = require('observ')
var SessionRecorder = require('lib/session-recorder')
var mkdirp = require('mkdirp')
var join = require('path').join

module.exports = ProjectRecorder

function ProjectRecorder(context, items) {

  var obs = ObservStruct({
    recording: Observ(false)
  })

  var recorders = []
  var lastValue = false
  var stopRecording = null
  var project = context.project

  obs.recording(function(val) {
    if (val !== lastValue) {

      stopRecording&&stopRecording()
      lastValue = val

      if (lastValue) {
        var src = join('~recordings', 'Recording 1')
        project.resolveAvailable(src, function(err, src) {
          createRecording(src, function (err, path) {
            if (!err) {
              stopRecording = recordSession(path)
            } else {
              throw err
            }
          })
        })
      }
    }
  })

  return obs

  // scoped

  function recordSession(path){
    console.log('recording session to', path)

    var fs = project._state.fs
    var stream = fs.createWriteStream(path)

    var recorder = SessionRecorder(context, items)
    recorder(function (data) {
      stream.write(JSON.stringify(data) + '\n')
    })

    recorders.push(recorder)

    return function stop(){
      recorder.destroy()
      stream.end()
      recorders.splice(recorders.indexOf(recorder, 1))
    }
  }

  function createRecording (src, cb) {
    var fs = project._state.fs 
    var path = project.resolve(src)
    var fileName = Date.now() + '.ldj'
    mkdirp(path, { 
      fs: fs
    }, function (err) {
      var data = JSON.stringify({
        node: 'recording',
        recording: { node: 'LDJson', src: './' + fileName }
      })
      fs.writeFile(join(path, 'index.json'), data, function (err) {
        if (err) return cb && cb(err)
        cb(null, join(path, fileName))
      })
    })
  }
}