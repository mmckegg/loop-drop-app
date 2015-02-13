var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('./select.js')

var read = require('./read.js')
var IndexParam = require('./index-param.js')

var rowOptions = [['1 row', 1], ['2 rows', 2], ['3 rows', 3], ['4 rows', 4],['5 rows', 5],['6 rows', 6],['7 rows', 7],['8 rows', 8]]
var colOptions = [['1 col', 1], ['2 cols', 2], ['3 cols', 3], ['4 cols', 4],['5 cols', 5],['6 cols', 6],['7 cols', 7],['8 cols', 8]]

module.exports = function(param){
  var widthSlider = h('div.slider')
  var heightSlider = h('div.slider')

  return h('div', [
    select(IndexParam(param, 0), {options: rowOptions, missingPrefix: ' rows'}),
    select(IndexParam(param, 1), {options: colOptions, missingPrefix: ' cols'})
  ])
}