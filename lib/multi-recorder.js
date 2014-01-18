var inherits = require('util').inherits;
var Readable = require('stream').Readable;

module.exports = MultiRecorder

function MultiRecorder(audioContext, inputCount, opt){
  if (!(this instanceof MultiRecorder)) {
    return new MultiRecorder(audioContext, inputCount, opt);
  }
  Readable.call(this, { objectMode: true });

  var self = this
  this.context = audioContext
  this.inputs = new Array(inputCount)
  var opt = opt || {}

  var merger = audioContext.createChannelMerger(inputCount*2)

  for (var i=0;i<inputCount;i++){
    var input = audioContext.createChannelSplitter(2)
    input.channelCount = 2
    input.channelCountMode = "explicit"
    input.connect(merger, 0, i*2)
    input.connect(merger, 1, i*2+1)
    this.inputs[i] = input
  }

  this._recorder = this.context.createScriptProcessor(8192, inputCount*2, 2)
  var silentFor = (opt.silenceDuration || 0)

  merger.connect(this._recorder)

  this._processAudio = function(e){
    var count = e.inputBuffer.numberOfChannels
    var length = e.inputBuffer.length
    var isSilent = true
    var buffers = new Array(inputCount)
    for (var i=0;i<inputCount;i++){
      var channel1 = e.inputBuffer.getChannelData(i*2)
      var channel2 = e.inputBuffer.getChannelData((i*2)+1)
      var buffer = buffers[i] = new Buffer(length * 4)
    
      for (var n=0;n<length;n++){
        var offset = n * 4
        write16BitPCM(buffer, offset, channel1[n])
        write16BitPCM(buffer, offset + 2, channel2[n])
        if (channel1[n] || channel2[n]){
          isSilent = false
        }
      }
    }
    
    if (isSilent){
      silentFor += e.inputBuffer.duration
    } else {
      silentFor = 0
    }
    
    if (!isSilent || !opt.silenceDuration || silentFor < opt.silenceDuration){
      self.push(buffers)
    }

  }

  console.debug('multirecorder: initialized')
  this._recorder.connect(audioContext.destination)
}

inherits(MultiRecorder, Readable);


MultiRecorder.prototype._read = function(e){
  if (!this._recorder.onaudioprocess){
    this._recorder.onaudioprocess = this._processAudio
  }
}

function write16BitPCM(output, offset, data){
  // if greater than 0x7FFA, Mac OS refuses to play it (invalid format)
  var sample = Math.round(data < 0 ? data * 0x8000 : data * 0x7FFF)
  var clipped = Math.max(-0x8000, Math.min(0x7FFF, sample));
  output.writeInt16LE(clipped, offset);
}