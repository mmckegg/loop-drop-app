var h = require('micro-css/h')(require('virtual-dom/h'))

module.exports = function renderLoopPosition(data){
  var positionElements = []

  if (Array.isArray(data)){
    for (var i=0;i<data[1];i++){
      var active = Math.floor(data[0]) == i
      positionElements.push(h('div', {className: active ? '-active' : ''}))
    }
  }

  return h('LoopPosition', positionElements)
}