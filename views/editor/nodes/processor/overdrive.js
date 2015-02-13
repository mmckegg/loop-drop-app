var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var Range = require('../../params/range.js')
var ModRange = require('../../params/mod-range.js')


module.exports = function(node){
  var data = node()

  return h('ProcessorNode -overdrive', [

    Header(node, h('span', 'Overdrive')),

    h('ParamList', [

      ModRange(QueryParam(node, 'band'), {
        title: 'pre band',
        defaultValue: 0.5,
        format: 'ratio',
        flex: true
      }),

      ModRange(QueryParam(node, 'color'), {
        title: 'color',
        defaultValue: 800,
        format: 'arfo',
        flex: true
      }),

      ModRange(QueryParam(node, 'gain'), {
        title: 'gain',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(QueryParam(node, 'postCut'), {
        title: 'post cut',
        defaultValue: 3000,
        format: 'arfo',
        flex: true
      })

    ])

  ])
}