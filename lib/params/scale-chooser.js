var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var read = require('lib/read')

module.exports = ScaleChooser

function ScaleChooser(param){
  var value = getValue(read(param))
  
  var buttons = []
  for (var i=0;i<12;i++){
    var button = h('div.button', {
      tabIndex: '0', 
      className: ~value.indexOf(i) ? '-selected' : '',
      'ev-click': mercury.event(handleClick, {param: param, id: i})
    })
    buttons.push(button)
  }
  return h('ScaleChooser', buttons)
}

function handleClick(target){
  var value = getValue(read(target.param))
  var index = value.indexOf(target.id)
  value = value.slice()

  if (~index){
    value.splice(index, 1)
  } else {
    value.push(target.id)
    value.sort(compare)
  }

  target.param.set(value)
}

function compare(a,b){
  return a - b
}

function getValue(source){
  return Array.isArray(source) ? source : [0,1,2,3,4,5,6,7,8,9,10,11]
}