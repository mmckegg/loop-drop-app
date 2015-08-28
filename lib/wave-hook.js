var WaveSvg = require('lib/wave-svg')
var resolve = require('path').resolve
var watch = require('observ/watch')

module.exports = WaveHook;

var cache = {}

function WaveHook(context, src) {
  if (!(this instanceof WaveHook)) {
      return new WaveHook(context, src);
  }
  this.context = context
  this.src = src;
}

WaveHook.prototype.hook = function (node, prop, prev) {
  if (!prev) {
    var path = resolve(this.context.cwd, this.src)
    if (!cache[path]) {
      cache[path] = WaveSvg(path, this.context)
    }
    watch(cache[path], function (svg) {
      node.innerHTML = svg
    })
  }
};

WaveHook.prototype.unhook = function (node, prop, next) {
  if (next && next._type === 'WaveHook') {
      return;
  }
  node.style.backgroundImage = null
};

WaveHook.prototype._type = 'WaveHook';
