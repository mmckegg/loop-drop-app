var WaveSvg = require('lib/wave-svg')
var resolve = require('path').resolve

module.exports = WaveHook;

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
    WaveSvg(path, this.context)(function (svg) {
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
