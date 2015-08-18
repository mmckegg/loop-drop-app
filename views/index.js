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
          h('ModParam -value -flex', [
            h('div.param -noDrop', [
              Range(state.tempo, {large: true, format: 'bpm', flex: true}),
            ]),
            h('div.sub', [
              h('div', [
                Range(state.swing, {format: 'ratio1', title: 'swing', flex: true}),
                h('button.action -slow', {
                  'ev-mousedown': send(setValue, context.speed, 0.95),
                  'ev-mouseup': send(setValue, context.speed, 1)
                }, ['<||']),
                h('button.action -tap', {
                  'ev-click': send(actions.tapTempo)
                }, ['TAP']),
                h('button.action -fast', {
                  'ev-mousedown': send(setValue, context.speed, 1.05),
                  'ev-mouseup': send(setValue, context.speed, 1)
                }, ['||>'])
              ])
            ])
          ]),
        ]),
        h('div.browser', [

          h('div -setups', [
            h('header', [
              h('span', 'Setups'), h('button.new', {'ev-click': send(actions.newSetup)}, '+ New')
            ]),
            renderBrowser(state.entries, state, actions)
          ]),

          h('div -recordings', [
            h('header', [
              h('span', 'Recordings'),
              ToggleButton(state.recording, {
                classList: ['.record'],
                title: 'Record',
                description: 'Record output audio to project folder'
              })
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

function setValue (target) {
  target.set(this.opts)
}