var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')

module.exports = ToggleChooser

function ToggleChooser (param, opts) {
  return h('ToggleChooser', [
    h('span.title', opts.title),
    computed([opts.options], function (options) {
      return options.map(function (option) {
        if (Array.isArray(option)) {
          return h('div.choice', {
            classList: computed([param, option[1]], activeWhenEqual),
            events: {
              click: send(param.set, option[1])
            }
          }, option[0])
        } else if (typeof option === 'string' || typeof option === 'number') {
          return h('div.choice', {
            classList: computed([param, option], activeWhenEqual),
            events: {
              click: send(param.set, option)
            }
          }, String(option))
        }
      })
    })
  ])
}

function activeWhenEqual (a, b) {
  if (a === b || (a == null && b == null)) {
    return '-active'
  }
}
