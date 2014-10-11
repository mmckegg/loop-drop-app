var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var range = require('../../params/range.js')
var select = require('../../params/select.js')

module.exports = renderParams

function renderParams(controller, setup){
  return h('ParamList', [
    select(controller.port, {
      options: controller.portChoices,
      flex: true,
      missingPrefix: ' (disconnected)',
      includeBlank: "No Midi Device"
    })
  ])
}