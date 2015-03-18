var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var range = require('lib/params/range.js')
var select = require('lib/params/select.js')
var QueryParam = require('loop-drop-setup/query-param')

//TODO: this should be retrieved from context.nodes instead
var controllerOptions = require('lib/context/controllers.js')._choices

module.exports = renderParams

function renderParams(controller){
  var params = [
    select(QueryParam(controller, 'node'), {
      options: controllerOptions,
      flex: true,
      missingPrefix: ' (unknown)'
    })
  ]

  if (controller.port && controller.portChoices){
    params.push(
      select(controller.port, {
        options: controller.portChoices,
        flex: true,
        missingPrefix: ' (disconnected)',
        includeBlank: "No Midi Device"
      })
    )
  }

  return h('ParamList', params)
}