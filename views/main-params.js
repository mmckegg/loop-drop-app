var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var range = require('./editor/params/range.js')

module.exports = function(state, actions){
  return h('MainParams', [
    h('button.changeProject', { 'ev-click': mercury.event(actions.changeProject) }, 'Change Project'),
    range(state.tempo, {large: true, format: 'bpm'})
  ])
}