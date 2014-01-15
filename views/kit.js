var h = require('create-element')

module.exports = function(){

  var result = []
  var busNames = 'ABCDEFGH'.split('')

  for (var i=0;i<64;i++){

    var fillHandle = h('div', { 
      'class': '.fill', 
      'draggable': 'false',
      'data-behavior': 'slot.fill'
    })

    var element = h('div', { 
      'data-id': String(i), 
      'draggable': 'true',
      'data-behavior': 'slot.drag'
    }, fillHandle)

    result.push(element)
  }

  for (var i=0;i<8;i++){

    var element = h('div', {
      'class': '-bus',
      'data-id': busNames[i], 
      'draggable': 'true',
      'data-behavior': 'slot.drag'
    }, h('span', busNames[i]))

    result.push(element)
  }

  return result.join('')
}