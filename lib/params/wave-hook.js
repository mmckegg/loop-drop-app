var watch = require('observ/watch')
var nextTick = require('next-tick')
var getValue = require('lib/get-value')
var read = require('lib/read')

var caches = {}

module.exports = WaveHook

function WaveHook(node, width, height){
  if (!(this instanceof WaveHook)) return new WaveHook(node, width, height)
  this.node = node
  this.width = width
  this.height = height
}

WaveHook.prototype.hook = function(node, prop, current){
  var self = this

  if (current && self.node !== current.node){
    self.unhook(node, prop)
    current = null
  }

  if (!current && self.node.resolvedBuffer){
    nextTick(function(){
      self.removeListener = watch(self.node.resolvedBuffer, self.update.bind(self, node))
    })
  }
}

WaveHook.prototype.unhook = function(node, prop, next){
  if (next){
    next.removeListener = this.removeListener
    next.currentPath = this.currentPath
  } else if (this.removeListener){
    this.removeListener()
    this.removeListener = null
    node.setAttribute('d', 'M0,250 L400,250')
    node.removeAttribute('transform')
  }
}

WaveHook.prototype.update = function(node, buffer){
  var descriptor = read(this.node) || {}
  var gain = getValue(descriptor.amp, 1)

  if (buffer){
    var data = buffer ? buffer.getChannelData(0) : []
    var step = data.length / this.width
    var quant = Math.ceil(step)
    var currentWidthScale = quant / step
    
    var offsetHeight = (((gain*this.height) - this.height) / 2) / gain
    node.setAttribute('transform', 'scale(' + currentWidthScale + ' ' + gain + ') translate(0 ' + -offsetHeight + ')')

    var cache = getCache(this.width, this.height)
    var path = cache.get(buffer)

    if (!path){
      path = getPathForData(data, this.width, this.height)
      cache.set(buffer, path)
    }

    if (this.currentPath !== path){
      node.setAttribute('d', path)
      this.currentPath = path
    }

  }
}

function getCache(width, height){
  var key = this.width+'/'+this.height
  if (!caches[key]){
    caches[key] = new WeakMap()
  }
  return caches[key]
}

function getPathForData(data, width, height){
  
  var step = Math.ceil( data.length / width )
  var amp = (height / 2)

  var maxValues = []
  var minValues = []

  for(var i=0;i<width;i++){
    var min = 1.0
    var max = -1.0
    var defined = false
    for (j=0; j<step; j++) {
      var datum = data[(i*step)+j]
      if (datum < min){
        min = datum
        defined = true
      }
      if (datum > max){
        max = datum
        defined = true
      }
    }

    if (defined){
      maxValues[i] = max
      minValues[i] = min
    } else {
      maxValues[i] = 0
      minValues[i] = 0
    }

  }

  // top
  var result = 'M0,' + (height/2)
  maxValues.forEach(function(val, i){
    result += ' L' + i + ',' + Math.round(amp+(val*amp))
  })

  // end point
  result += ' L' + width + ',' + (height/2)


  // bottom
  minValues.reverse().forEach(function(val,i){
    result += ' L' + (width-i-1) + ',' + Math.round(amp+(val*amp))
  })

  return result + ' Z'
}