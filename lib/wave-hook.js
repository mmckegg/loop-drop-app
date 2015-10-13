var WaveSvg = require('lib/wave-svg')
var resolve = require('path').resolve

module.exports = WaveHook

var cache = {}

function WaveHook (context, src) {
  if (!(this instanceof WaveHook)) {
    return new WaveHook(context, src)
  }
  this.context = context
  this.src = src
}

WaveHook.prototype.hook = function (node, prop, prev) {
  if (!prev || prev.src !== this.src) {
    node.innerHTML = ''
    var path = resolve(this.context.cwd, this.src)
    if (!cache[path]) {
      cache[path] = WaveSvg(path, this.context)
    }

    waitForLoad(cache[path], function () {
      node.innerHTML = cache[path]()
      var svg = node.querySelector('svg')
      if (svg) {
        this.release = cache[path].onAppendChild(function (fragment) {
          svg.insertAdjacentHTML('afterbegin', fragment)
        })
      }
    })
  }
}

WaveHook.prototype.unhook = function (node, prop, next) {
  if (this.release) {
    this.release()
    this.release = null
  }
  if (next && next._type === 'WaveHook') {
    return
  }
  node.innerHTML = ''
}

WaveHook.prototype._type = 'WaveHook'

function waitForLoad (svg, cb) {
  if (svg()) {
    process.nextTick(cb)
  } else {
    var release = svg(function (val) {
      if (val) {
        setImmediate(release)
        cb()
      }
    })
  }
}
