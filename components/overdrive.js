
/**
 * Overdrive effect module for the Web Audio API.
 *
 * @param {AudioContext} context
 * @param {object} opts
 * @param {number} opts.preBand
 * @param {number} opts.color
 * @param {number} opts.drive
 * @param {number} opts.postCut
 */

function Overdrive (context, opts) {
  this.input = context.createGainNode();
  this.output = context.createGainNode();

  // Internal AudioNodes
  this._bandpass = context.createBiquadFilter();
  this._bpWet = context.createGainNode();
  this._bpDry = context.createGainNode();
  this._ws = context.createWaveShaper();
  this._lowpass = context.createBiquadFilter();

  // AudioNode graph routing
  this.input.connect(this._bandpass);
  this._bandpass.connect(this._bpWet);
  this._bandpass.connect(this._bpDry);
  this._bpWet.connect(this._ws);
  this._bpDry.connect(this._ws);
  this._ws.connect(this._lowpass);
  this._lowpass.connect(this.output);

  // Defaults
  var p = this.meta.params;
  opts = opts || {};
  this._bandpass.frequency.value  = opts.color        || p.color.defaultValue;
  this._bpWet.gain.value          = opts.preBand      || p.preBand.defaultValue;
  this._lowpass.frequency.value   = opts.postCut      || p.postCut.defaultValue;
  this.drive                      = opts.drive        || p.drive.defaultValue;

  // Inverted preBand value
  this._bpDry.gain.value = opts.preBand 
    ? 1 - opts.preBand
    : 1 - p.preBand.defaultValue;
}

Overdrive.prototype = Object.create(null, {

  /**
   * AudioNode prototype `connect` method.
   *
   * @param {AudioNode} dest
   */

  connect: {
    value: function (dest) {
      this.output.connect( dest.input ? dest.input : dest );
    }
  },

  /**
   * AudioNode prototype `disconnect` method.
   */

  disconnect: {
    value: function () {
      this.output.disconnect();
    }
  },

  /**
   * Module parameter metadata.
   */

  meta: {
    value: {
      name: "Overdrive",
      params: {
        preBand: {
          min: 0,
          max: 1.0,
          defaultValue: 0.5,
          type: "float"
        },
        color: {
          min: 0,
          max: 22050,
          defaultValue: 800,
          type: "float"
        },
        drive: {
          min: 0.0,
          max: 1.0,
          defaultValue: 0.5,
          type: "float"
        },
        postCut: {
          min: 0,
          max: 22050,
          defaultValue: 3000,
          type: "float"
        }
      }
    }
  },

  /**
   * Public parameters
   */

  preBand: {
    enumerable: true,
    get: function () { return this._bpWet.gain.value; },
    set: function (value) {
      this._bpWet.gain.setValueAtTime(value, 0);
      this._bpDry.gain.setValueAtTime(1 - value, 0);
    }
  },

  color: {
    enumerable: true,
    get: function () { return this._bandpass.frequency.value; },
    set: function (value) {
      this._bandpass.frequency.setValueAtTime(value, 0);
    }
  },

  drive: {
    enumerable: true,
    get: function () { return this._drive; },
    set: function (value) {
      var k = value * 100
        , n = 22050
        , curve = new Float32Array(n)
        , deg = Math.PI / 180;

      this._drive = value;
      for (var i = 0; i < n; i++) {
        var x = i * 2 / n - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
      this._ws.curve = curve;
    }
  },

  postCut: {
    enumerable: true,
    get: function () { return this._lowpass.frequency.value; },
    set: function (value) {
      this._lowpass.frequency.setValueAtTime(value, 0);
    }
  }

});

/**
 * Exports.
 */

module.exports = Overdrive;

