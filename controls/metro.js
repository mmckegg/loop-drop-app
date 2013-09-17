var h = require('hyperscript')

module.exports = function(){
  var lastCell = null
  var cells = [
    h('div'),
    h('div'),
    h('div'),
    h('div'),
    h('div'),
    h('div'),
    h('div'),
    h('div')
  ]
  var metro = h('div.Metro', cells)

  metro.setBeat = function(beat){
    var b = beat % 8
    if (lastCell){
      lastCell.classList.remove('-active')
    }
    lastCell = cells[b]
    lastCell.classList.add('-active')
  }

  metro.flash = function(){
    metro.classList.add('-tap')
    setTimeout(function(){
      metro.classList.remove('-tap')
    }, 100)
  }

  return metro
}