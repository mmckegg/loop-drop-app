var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var importSample = require('lib/import-sample')
var WaveRecorder = require('wave-recorder')
var extend = require('xtend')
var recordingLookup = new WeakMap()

module.exports = SampleChooser

function SampleChooser (node, opts) {
  var state = recordingLookup.get(node)
  var classes = ['ToggleButton', '-record']
  var title = 'Record'
  if (state) {
    classes.push('-active')
    title = 'Stop Recording'
  }
  return h('button', {
    className: classes.join(' '),
    title: title,
    'ev-click': state ? send(stopRecording, node) : send(startRecording, node)
  }, title)
}

function startRecording (node) {
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

  navigator.webkitGetUserMedia({ audio: true }, function (mediaStream) {
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

function stopRecording (node) {
  var state = recordingLookup.get(node)
  if (state && state.recorder) {
    recordingLookup.delete(node)
    state.recorder.end()
  }
}
