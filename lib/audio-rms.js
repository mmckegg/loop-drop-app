var inherits = require('util').inherits;
var Readable = require('stream').Readable;

module.exports = AudioRms

function AudioRms(audioContext){
  if (!(this instanceof AudioRms)) {
    return new AudioRms(audioContext);
  }
  Readable.call(this, { objectMode: true });

  var self = this

  this.context = audioContext
  this.input = audioContext.createGain()
  this._meter = this.context.createScriptProcessor(512*4, 2, 2)
  this.input.connect(this._meter)

  var lastL = 0
  var lastR = 0

  this._processAudio = function(e){
    var rmsL = 0
    var rmsR = 0

    var inputL = e.inputBuffer.getChannelData(0)
    var inputR = e.inputBuffer.getChannelData(1)

    for (var i = 0, ii = e.inputBuffer.length; i < ii; i++) {
      rmsL += (inputL[i] * inputL[i]) / 2
      rmsR += (inputR[i] * inputR[i]) / 2
    }

    rmsL = Math.sqrt(rmsL) / 10
    rmsR = Math.sqrt(rmsR) / 10

    if (rmsL != lastL || rmsR != lastR){
      self.push([rmsL, rmsR])
      lastL = rmsL
      lastR = rmsR
    }
  }

  this._meter.connect(audioContext.destination)

}

inherits(AudioRms, Readable);


AudioRms.prototype._read = function(e){
  if (!this._meter.onaudioprocess){
    this._meter.onaudioprocess = this._processAudio
  }
}