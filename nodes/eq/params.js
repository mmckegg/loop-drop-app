var h = require('lib/h')
var ModRange = require('lib/params/mod-range')

module.exports = function eqParams(node) {
  return h('ParamList', [
    ModRange(node.low, {
      title: 'low',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),
    ModRange(node.mid, {
      title: 'mid',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),
    ModRange(node.high, {
      title: 'high',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),

    ModRange(node.lowcut, {
      title: 'lowcut',
      format: 'arfo',
      flex: 'small',
      defaultValue: 0
    }),

    ModRange(node.highcut, {
      title: 'highcut',
      format: 'arfo',
      flex: 'small',
      defaultValue: 20000
    })

  ])
}