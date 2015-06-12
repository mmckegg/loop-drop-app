var WaveRecorder = require('wave-recorder')
var ObservStruct = require('observ-struct')
var Observ = require('observ')

module.exports = SessionRecorder

function SessionRecorder(context) {

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
        stopRecording = recordOutput(context.project.resolve('session ' + Date.now() + '.wav'))
      }
    }
  })

  return obs

  // scoped

  function recordOutput(path){
    console.log('recording output to', path)

    var fs = context.project._state.fs
    var stream = fs.createWriteStream(path)

    var recorder = WaveRecorder(context.audio, {
      silenceDuration: 5, 
      startSilent: true, 
      bitDepth: 32
    })

    recorder.pipe(stream)

    recorder.on('header', function(){
      //fs.write(path, recorder._header, 0, recorder._header.length, 0, noop)
    })

    recorders.push(recorder)
    context.output.connect(recorder.input)

    return function stop(){
      recorder.end()
      recorders.splice(recorders.indexOf(recorder, 1))
    }
  }

}