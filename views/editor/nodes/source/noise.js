var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Header = require('../header.js')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var types = [
  ['White', 'white'],
  ['Pink', 'pink']
]

module.exports = function(node){
  var data = node()

  return h('SourceNode -noise', [

    Header(node, h('span', [
      h('strong', 'Noise:'), ' ',
      h('span', data.type || 'white')
    ])),

    h('ParamList', [

      Select(node.type, { 
        options: types 
      }),

      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      })

    ])

  ])
}