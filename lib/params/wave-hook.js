var watch = require('observ/watch')
var nextTick = require('next-tick')
var getValue = require('lib/get-value')
var read = require('lib/read')

var worker = new Worker('file://' + __dirname + '/../worker/wave-path.js')
var callbacks = {}
var nextId = 0

worker.onmessage = function (e) {
  if (callbacks[e.data.id]) {
    callbacks[e.data.id](e.data.result)
    delete callbacks[e.data.id]
  }
}

var caches = {}

module.exports = WaveHook

function WaveHook (node, width, height) {
  if (!(this instanceof WaveHook)) return new WaveHook(node, width, height)
  this.node = node
  this.width = width
  this.height = height
}

WaveHook.prototype.hook = function (node, prop, current) {
  var self = this

  if (current && self.node !== current.node) {
    self.unhook(node, prop)
    current = null
  }

  if (!current && self.node.resolvedBuffer) {
    nextTick(function () {
      self.removeListener = watch(self.node.resolvedBuffer, self.update.bind(self, node))
    })
  }
}

WaveHook.prototype.unhook = function (node, prop, next) {
  if (next) {
    next.removeListener = this.removeListener
    next.currentPath = this.currentPath
  } else if (this.removeListener) {
    this.removeListener()
    this.removeListener = null
    node.setAttribute('d', 'M0,250 L400,250')
    node.removeAttribute('transform')
  }
}

WaveHook.prototype.update = function (node, buffer) {
  var self = this
  var descriptor = read(this.node) || {}
  var gain = getValue(descriptor.amp, 1)

  if (buffer) {
    var data = buffer ? buffer.getChannelData(0) : []
    var step = data.length / this.width
    var quant = Math.ceil(step)
    var currentWidthScale = quant / step

    var offsetHeight = (((gain * this.height) - this.height) / 2) / gain
    node.setAttribute('transform', 'scale(' + currentWidthScale + ' ' + gain + ') translate(0 ' + -offsetHeight + ')')

    var cache = getCache(this.width, this.height)
    var path = cache.get(buffer)

    if (!path) {
      getPathForData(data, this.width, this.height, function (path) {
        self.currentPath = path
        cache.set(buffer, path)
        node.setAttribute('d', path)
      })
    } else {
      node.setAttribute('d', path)
      this.currentPath = path
    }
  }
}

function getCache (width, height) {
  var key = this.width + '/' + this.height
  if (!caches[key]) {
    caches[key] = new WeakMap()
  }
  return caches[key]
}

function getPathForData (data, width, height, cb) {
  var id = nextId++
  callbacks[id] = cb
  worker.postMessage({
    data: data,
    id: id,
    width: width,
    height: height
  })
}
