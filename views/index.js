var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderMainParams = require('./main-params.js')
var AudioMeter = require('./audio-meter.js')

var audioMeterOptions = {red: 1, amber: 0.9, min: 0, max: 1.3, steps: 60}

var renderBrowser = require('./browser.js')

module.exports = function(element, state, actions, context){
  var renderEditor = require('./tabbed-editor.js')(state, actions)
  
  var loop = mercury.main(state, function(data){
    return h('Holder', [
      h('div.side', [
        h('div.transport', [
          AudioMeter(context.output.rms.observ, audioMeterOptions),
          renderMainParams(state, actions)
        ]),
        h('div.browser', [
          renderBrowser(state, actions)
        ])
      ]),
      h('div.main', [
        renderEditor()
      ])
    ])
  }, mercury)

  state(loop.update)
  element.appendChild(loop.target)

  return function(){
    loop.update(state())
    console.log('force update')
  }
}