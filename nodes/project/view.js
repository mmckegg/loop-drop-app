var h = require('lib/h')
var send = require('value-event/event')

var AudioMeter = require('lib/widgets/audio-meter')
var Range = require('lib/params/range')
var ToggleButton = require('lib/params/toggle-button')

var audioMeterOptions = {red: 1, amber: 0.9, min: 0, max: 1.3, steps: 60}

var renderBrowser = require('./browser')
var renderEditor = require('./tabbed-editor')

module.exports = function(project) {

  var context = project.context
  var actions = project.actions

  return h('Holder', [
    h('div.side', [
      h('div.transport', [
        AudioMeter(project.outputRms, audioMeterOptions),
        h('ModParam -value -flex', [
          h('div.param -noDrop', [
            Range(project.tempo, {large: true, format: 'bpm', flex: true}),
          ]),
          h('div.sub', [
            h('div', [
              Range(project.swing, {format: 'ratio1', title: 'swing', flex: true}),
              h('button.action -slow', {
                'ev-mousedown': send(setValue, project.speed, 0.95),
                'ev-mouseup': send(setValue, project.speed, 1)
              }, ['<||']),
              h('button.action -tap', {
                'ev-click': send(actions.tapTempo)
              }, ['TAP']),
              h('button.action -fast', {
                'ev-mousedown': send(setValue, project.speed, 1.05),
                'ev-mouseup': send(setValue, project.speed, 1)
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
          renderBrowser(project.entries, project)
        ]),

        h('div -recordings', [
          h('header', [
            h('span', 'Recordings'),
            ToggleButton(project.recording, {
              classList: ['.record'],
              title: 'Record',
              description: 'Record output audio to project folder'
            })
          ]),
          renderBrowser(project.recordingEntries, project)
        ])
      ])
    ]),
    h('div.main', [
      renderEditor(project)
    ])
  ])
}

function setValue (target) {
  target.set(this.opts)
}