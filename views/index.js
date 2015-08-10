var VirtualDom = require('virtual-dom')
var MainLoop = require('main-loop')
var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var AudioMeter = require('./audio-meter.js')
var Range = require('lib/params/range')
var ToggleButton = require('lib/params/toggle-button')

var audioMeterOptions = {red: 1, amber: 0.9, min: 0, max: 1.3, steps: 60}

var renderBrowser = require('./browser.js')

module.exports = function(element, state, actions, context){
  var renderEditor = require('./tabbed-editor.js')(state, actions)
  
  var loop = MainLoop(state, function(){
    return h('Holder', [
      h('div.side', [
        h('div.transport', [
          AudioMeter(context.output.rms.observ, audioMeterOptions),
          h('MainParams', [
            Range(state.tempo, {large: true, format: 'bpm'}),
            ToggleButton(state.recording, {
              classList: ['.record', '-main'],
              title: 'Record',
              description: 'Record output audio to project folder'
            })
          ])
        ]),
        h('div.browser', [

          h('div', {className: 'Browser'}, [
            h('header', [
              h('span', 'Setups'), h('button.new', {'ev-click': send(actions.newSetup)}, '+ New')
            ]),
            renderBrowser(state.entries, state, actions)
          ]),

          h('div', {className: 'Browser'}, [
            h('header', [
              h('span', 'Recordings')
            ]),
            renderBrowser(state.recordingEntries, state, actions)
          ])
        ])
      ]),
      h('div.main', [
        renderEditor()
      ])
    ])
  }, VirtualDom)

  state(function () {
    // HACK: schedule 100 ms ahead to avoid audio interuption
    window.rootContext.scheduler.schedule(0.1)
    loop.update()
  })

  element.appendChild(loop.target)

  return function(){
    loop.update(state())
    console.log('force update')
  }
}