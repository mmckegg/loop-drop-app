var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var range = require('../../params/range.js')
var select = require('../../params/select.js')

var controllerOptions = require('../../../../midi-controllers.js')._choices

module.exports = renderParams

function renderParams(controller, setup){
  return h('ParamList', [
    select(controller.node, {
      options: controllerOptions,
      flex: true,
      missingPrefix: ' (unknown)'
    }),
    select(controller.port, {
      options: controller.portChoices,
      flex: true,
      missingPrefix: ' (disconnected)',
      includeBlank: "No Midi Device"
    })
  ])
}