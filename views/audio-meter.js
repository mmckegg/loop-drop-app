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
  var startState = {value: this.value(), opts: this.opts}
  var main = mercury.main(startState, render)

  var state = this.state = {
    value: this.value,
    opts: this.opts,
    update: function(){
      main.update({value: state.value(), opts: state.opts})
    }
  }
  bind(this.state)
  return main.target
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

function render(state){
  var value = state.value || [0,0]
  var opts = state.opts
  return h('AudioMeter', [
    h('div.left', getElements(value[0], opts)),
    h('div.right', getElements(value[1], opts))
  ])
}

function getElements(value, options){
  var result = []
  var range = options.max - options.min
  var step = range / options.steps
  for (var i=options.min;i<options.max;i+=step){
    var className = value > i ? '-active' : ''
    if (i>=options.red){
      result.push(h('div -red', {className: className}))
    } else if (i>=options.amber){
      result.push(h('div -amber', {className: className}))
    } else {
      result.push(h('div', {className: className}))
    }
  }
  return result
}