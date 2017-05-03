var isTriggerable = require('lib/is-triggerable')

module.exports = {
  name: 'LFO',
  group: 'modulators',
  node: 'modulator/lfo',
  object: require('./object'),
  render: require('./view'),
  spawn: function (context) {
    var result = {
      amp: 0.5,
      mode: 'add',
      value: 0.5
    }
    if (!isTriggerable({context})) {
      result.trigger = false
    }
    return result
  }
}
