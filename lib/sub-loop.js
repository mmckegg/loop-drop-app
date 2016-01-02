var VirtualDom = require('virtual-dom')
var MainLoop = require('main-loop')
var createElement = require('virtual-dom/create-element')
var h = require('micro-css/h')(require('virtual-dom/h'))
var shallowEq = require('vdom-thunk/shallow-eq')

module.exports = SubLoop

function SubLoop (observ, render) {
  if (!(this instanceof SubLoop)) return new SubLoop(observ, render)
  this.observ = observ
  this.render = render
  this.releases = []
}

SubLoop.prototype.type = 'Widget'

SubLoop.prototype.init = function () {
  while (this.releases.length) {
    this.releases.pop()()
  }

  if (typeof this.render === 'function') {
    var observs = Array.isArray(this.observ) ? this.observ : [ this.observ ]
    var loop = MainLoop(null, () => { return this.render(...observs) }, VirtualDom)
    observs.forEach((obs) => typeof obs === 'function' && this.releases.push(obs(loop.update)))
    return loop.target
  } else {
    return createElement(h('div'))
  }
}

SubLoop.prototype.update = function (prev, elem) {
  this.releases = prev.releases
  if (!eq(this.observ, prev.observ) || this.render !== prev.render) {
    return this.init()
  }
}

SubLoop.prototype.destroy = function (prev, elem) {
  while (this.releases.length) {
    this.releases.pop()()
  }
}

function eq (a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return shallowEq(a, b)
  } else {
    return a === b
  }
}
