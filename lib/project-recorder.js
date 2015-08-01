var WaveRecorder = require('wave-recorder')
var ObservStruct = require('observ-struct')
var Observ = require('observ')
var SessionRecorder = require('lib/session-recorder')

module.exports = ProjectRecorder

function ProjectRecorder(context, items) {

  var obs = ObservStruct({
    recording: Observ(false)
  })

  var recorders = []
  var lastValue = false
  var stopRecording = null

  obs.recording(function(val) {
    if (val !== lastValue) {

      stopRecording&&stopRecording()
      lastValue = val

      if (lastValue) {
        stopRecording = recordSession(context.project.resolve('session ' + Date.now() + '.ldj'))
      }
    }
  })

  return obs

  // scoped

  function recordSession(path){
    console.log('recording session to', path)

    var fs = context.project._state.fs
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

}