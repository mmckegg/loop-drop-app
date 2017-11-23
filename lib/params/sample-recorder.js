var Value = require('mutant/value')
var extend = require('xtend')
var WaveRecorder = require('wave-recorder')

var ToggleButton = require('lib/params/toggle-button')
var importSample = require('lib/import-sample')

module.exports = SampleChooser

var recordingLookup = new WeakMap()

function SampleChooser (node, opts) {
  var isRecording = Value(false)

  isRecording(function (value) {
    if (value) {
      startRecording(node)
    } else {
      stopRecording(node)
    }
  })

  return ToggleButton(isRecording, {
    classList: ['-record'],
    title: 'Stop Recording',
    offTitle: 'Record'
  })
}

function startRecording (node) {
  var oldState = recordingLookup.get(node)
  if (!oldState) {
    var src = './' + Date.now() + '.wav'
    var filePath = node.context.fileObject.resolvePath(src)
    var state = {
      node: node,
      recorder: null,
      path: filePath,
      src: src
    }

    recordingLookup.set(node, state)

    // hack to update the state - should really be a widget, or be part of project
    node.buffer.set(extend(node.buffer(), {recording: true}))

    navigator.webkitGetUserMedia({
      audio: {
        echoCancellation: {exact: false}
      }
    }, function (mediaStream) {
      var input = node.context.audio.createMediaStreamSource(mediaStream)
      var recorder = WaveRecorder(node.context.audio, { channels: 2, bitDepth: 32 })
      var output = node.context.fs.createWriteStream(filePath)
      recorder.pipe(output)
      input.connect(recorder.input)
      state.recorder = recorder
      output.on('finish', function () {
        mediaStream.getAudioTracks()[0].stop()
        importSample(node.context, filePath, function (err, result) {
          if (!err) {
            node.buffer.set(result.buffer)
            node.offset.set(result.offset)
          }
        })
      })
    }, function (err) {
      throw err
    })
  }
}

function stopRecording (node) {
  var state = recordingLookup.get(node)
  if (state && state.recorder) {
    recordingLookup.delete(node)
    state.recorder.end()
  }
}
