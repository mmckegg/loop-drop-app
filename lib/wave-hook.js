var WaveSvg = require('lib/wave-svg')
var Path = require('path')
var resolve = require('mutant/resolve')

module.exports = WaveHook

var cache = {}

function WaveHook (context, src) {
  return function (element) {
    var path = Path.resolve(resolve(context.cwd), src)
    if (!cache[path]) {
      cache[path] = WaveSvg(path, context)
    }

    var svg = cache[path]
    element.innerHTML = ''

    waitForLoad(svg, function () {
      element.innerHTML = svg()
      var innerElement = element.querySelector('svg')
      if (innerElement) {
        svg.onAppendChild(function (fragment) {
          innerElement.insertAdjacentHTML('afterbegin', fragment)
        })
      }
    })

    return svg.destroy
  }
}

function waitForLoad (svg, cb) {
  if (svg()) {
    setImmediate(cb)
  } else {
    var release = svg(function (val) {
      if (val) {
        setImmediate(release)
        cb()
      }
    })
  }
}
