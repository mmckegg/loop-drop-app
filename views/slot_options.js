var h = require('create-element')

module.exports = function(){

  var result = ''
  var busNames = 'ABCDEFGH'.split('')

  for (var y=0;y<8;y++){
    result += '<optgroup label="' + busNames[y] + '">'
    for (var x=0;x<8;x++){
      var name = busNames[y] + (x + 1)
      var id = y * 8 + x
      result += h('option', { 
        'value': String(id)
      }, name)
    }
    result += '</optgroup>'
  }

  result += '<optgroup label="Busses">'
  for (var i=0;i<8;i++){
    var value = busNames[i]
    result += h('option', { 
      'value': value
    }, 'Bus ' + value)
  }
  result += '</optgroup>'

  return result
}