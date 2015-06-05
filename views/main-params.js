var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Range = require('lib/params/range.js')

module.exports = function(state, actions){
  return h('MainParams', [
    Range(state.tempo, {large: true, format: 'bpm'})
  ])
}