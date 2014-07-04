var h = require('create-element')

module.exports = function(){

  var result = ''
  var busNames = 'ABCDEFGH'.split('')

  for (var y=0;y<8;y++){
    for (var x=0;x<8;x++){
      var name = busNames[y] + (x + 1)
      var id = y * 8 + x
      result += h('option', { 
        'value': String(id)
      }, name)
    }
  }

  return result
}