var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var range = require('./editor/params/range.js')
var watch = require('observ/watch')

module.exports = AudioMeter

function AudioMeter(value, opts){
  if (!(this instanceof AudioMeter)) return new AudioMeter(value, opts)
  this.value = value
  this.opts = opts
}

AudioMeter.prototype.type = 'Widget'

AudioMeter.prototype.init = function(){
  var element = mercury.create(render(this.opts))

  var state = this.state = {
    value: this.value,
    opts: this.opts,
    lastL: 0,
    lastR: 0,
    update: function(){
      var current = state.value() || [state.opts.min, state.opts.min]
      var l = abs(current[0], state.opts)
      var r = abs(current[1], state.opts)
      updateActive(element.childNodes[0].childNodes, l, state.lastL)
      updateActive(element.childNodes[1].childNodes, r, state.lastR)
      state.lastL = l
      state.lastR  = r
    }
  }
  bind(this.state)
  return element
}

function updateActive(nodes, current, last){
  if (current > last){
    for (var i=last;i<=current;i++){
      nodes[i].classList.add('-active')
    }
  } else {
    for (var i=current;i<=last;i++){
      nodes[i].classList.remove('-active')
    }
  }
}

AudioMeter.prototype.update = function(prev, elem){
  this.state = prev.state
  this.state.value = this.value
  this.state.opts = this.opts
  if (this.value !== prev.value){
    bind(this.state)
  }
}

AudioMeter.prototype.destroy = function(){
  unbind(this.state)
}

function bind(state){
  unbind(state)
  if (state.value){
    state.removeListener = watch(state.value, state.update)
  }
}

function unbind(state){
  if (state.removeListener){
    state.removeListener()
    state.removeListener = null
  }
}

function render(opts){
  return h('AudioMeter', [
    h('div.left', getElements(opts)),
    h('div.right', getElements(opts))
  ])
}

function abs(value, options){
  return Math.min(Math.max(Math.floor((value - options.min) * options.steps / (options.max - options.min)), 0), options.steps-1)
}

function getElements(options){
  var result = []
  var range = options.max - options.min
  var step = range / options.steps
  for (var i=options.min;i<options.max;i+=step){
    if (i>=options.red){
      result.push(h('div -red'))
    } else if (i>=options.amber){
      result.push(h('div -amber'))
    } else {
      result.push(h('div'))
    }
  }
  return result
}