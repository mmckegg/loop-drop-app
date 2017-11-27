var clamp = require('lib/clamp')

module.exports = MidiNote

function MidiNote (context, opts) {
  if (!(this instanceof MidiNote)) return new MidiNote(context, opts)
  this.offset = context.midiClockOffset()
  this.output = opts.output
  this.velocity = clamp(Math.round(opts.velocity), 1, 127)
  this.channel = clamp(Math.round(opts.channel) || 1, 1, 16)
  this.note = clamp(Math.round(opts.note), 0, 127)
  this.state = 0
}

MidiNote.prototype.start = function (at) {
  if (this.state === 0) {
    this.output.write([144 + this.channel - 1, this.note, this.velocity], getMidiTime(this.offset, at))
    this.state = 1
  }
}

MidiNote.prototype.stop = function (at) {
  if (this.state === 1) {
    this.output.write([128 + this.channel - 1, this.note, 0], getMidiTime(this.offset, at))
    this.state = 2
  }
}

function getMidiTime (offset, at) {
  return at ? (at * 1000) + offset : window.performance.now()
}
