var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Node = require('observ-node-array/single')
var ResolvedValue = require('audio-slot/resolved-value')
var RecordingPlayer = require('lib/recording-player')
var RecordingRenderer = require('lib/recording-renderer')
var AudioBufferStream = require('lib/audio-buffer-stream')
var WaveFileWriter = require('wav/lib/file-writer')

var remote = require('remote')
var Dialog = remote.require('dialog')

module.exports = Recording

function Recording (parentContext) {
  var context = Object.create(parentContext)
  var player = RecordingPlayer(context)

  var obs = ObservStruct({
    recording: Node(context),
    start: Observ(null),
    end: Observ(null)
  })

  obs._type = 'LoopDropRecording'

  obs.events = ResolvedValue(obs.recording)
  obs.context = context

  obs.events(player.set)
  obs.position = player.position
  obs.playing = player.playing
  obs.destroy = player.destroy

  obs.exportFile = function (format) {
    Dialog.showSaveDialog({
      title: 'Export Recording (PCM Wave)',
      filters: [
        { name: 'PCM Wave', extensions: ['wav']}
      ]
    }, function (path) {
      if (path) {
        var renderer = RecordingRenderer(context)
        renderer.set(obs.events())
        setTimeout(function () {
          renderer.progress(function(val) {
            console.log(Math.round(val * 1000)/10)
          })
          renderer.render(function (err, audioBuffer) {
            if (err) throw err

            var bitDepth = 16
            var output = WaveFileWriter(path, {
              bitDepth: bitDepth,
              channels: audioBuffer.numberOfChannels
            })

            output.on('finish', function() {
              console.log('done')
            })

            AudioBufferStream(audioBuffer, bitDepth).pipe(output)
          })
        }, 2000)
      }
    })
  }
  
  return obs
}