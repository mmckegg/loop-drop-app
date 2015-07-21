var h = require('micro-css/h')(require('virtual-dom/h'))

var Header = require('../header.js')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')


module.exports = function(node){
  var data = node()

  return h('ProcessorNode -overdrive', [

    Header(node, h('span', 'Overdrive')),

    h('ParamList', [

      ModRange(node.preBand, {
        title: 'pre band',
        defaultValue: 0.5,
        format: 'ratio',
        flex: true
      }),
      ModRange(node.color, {
        title: 'color',
        defaultValue: 800,
        format: 'arfo',
        flex: true
      }),

      ModRange(node.gain, {
        title: 'gain',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(node.postCut, {
        title: 'post cut',
        defaultValue: 3000,
        format: 'arfo',
        flex: true
      })

    ])

  ])
}