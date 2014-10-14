var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('../../params/select.js')
var range = require('../../params/range.js')
var shapeChooser = require('../../params/shape.js')

var chunkNodeOptions = [
  ['Chunk', 'chunk'],
  ['Inherit Range', 'rangeChunk']
]

module.exports = renderOptions

function renderOptions(fileObject){
  var param = fileObject.getParam
  return h('section.options', [
    h('ParamList', [
      select(param('node'), {options: chunkNodeOptions}),
      shapeChooser(param('shape'))
    ])
  ])
}