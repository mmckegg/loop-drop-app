var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var select = require('../../params/select.js')
var range = require('../../params/range.js')

var QueryParam = require('loop-drop-setup/query-param')

var chunkNodeChoices = [
  ['Triggers', 'chunk'],
  ['Chromatic Scale', 'chunk/scale']
]

module.exports = renderOptions

function renderOptions(chunk){

  return h('section.options', [
    h('ParamList', [
      h('div -block', [
        h('div.extTitle', 'Grid Mode'),
        h('div', select(QueryParam(chunk, 'node'), {options: chunkNodeChoices}))
      ])
    ])
  ])
}