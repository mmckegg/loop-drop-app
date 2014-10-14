var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('./select.js')

var read = require('./read.js')

var rowOptions = [['1 row', 1], ['2 rows', 2], ['3 rows', 3], ['4 rows', 4],['5 rows', 5],['6 rows', 6],['7 rows', 7],['8 rows', 8]]
var colOptions = [['1 col', 1], ['2 cols', 2], ['3 cols', 3], ['4 cols', 4],['5 cols', 5],['6 cols', 6],['7 cols', 7],['8 cols', 8]]

module.exports = function(param){
  var widthSlider = h('div.slider')
  var heightSlider = h('div.slider')
  var value = read(param) || [1,1]

  return h('div', [
    select(IndexParam(param, 0), {options: rowOptions}),
    select(IndexParam(param, 1), {options: colOptions}),
  ])
}

function IndexParam(target, index){
  if (!(this instanceof IndexParam)) return new IndexParam(target, index)
  this.target = target
  this.index = index
}

IndexParam.prototype.set = function(value){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  var res = val.slice()
  res[this.index] = parseInt(value) || 0
  console.log('set', res)
  this.target.set(res)
}

IndexParam.prototype.read = function(){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  return val[this.index]
}