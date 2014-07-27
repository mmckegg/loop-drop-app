var behave = require('dom-behavior')
var Remote = require('loop-drop-remote')

var behaviors = {
  'slot': {
    selector: require('./slot/selector'),
    drag: require('./slot/drag'),
    fill: require('./slot/fill')
  },
  'editor': {
    raw: require('./editor/raw'),
    visual: require('./editor/visual'),
    modeSelector: require('./editor/mode_selector')
  },
  'deck': {
    selected: require('./deck/selected'),
    kits: require('./deck/kits'),
    control: require('./deck/control'),
    loopPosition: require('./deck/loop_position')
  },
  'remote': function(element){
    var remote = null
    window.events.on('connect', function(server){
      if (!remote){
        remote = Remote(window.context.audio, element)
        remote.output.connect(window.context.audio.destination)
      }
      remote.connect(server, window.context.instances.left, 'Loop Drop')
      window.events.emit('connected', server)
    })

    window.events.on('disconnect', function(){
      if (remote){
        remote.disconnect()
        window.events.emit('disconnected')
      }
    })
  },
  'showWhenConnected': function(element){
    element.hidden = true
    window.events.on('connected', function(){
      element.hidden = false
    })
    window.events.on('disconnected', function(){
      element.hidden = true
    })
  },
  'hideWhenConnected': function(element){
    window.events.on('connected', function(){
      element.hidden = true
    })
    window.events.on('disconnected', function(){
      element.hidden = false
    })
  },
  'project': require('./project'),
  'engine': require('./engine'),
  'window': {
    tempo: require('./window/tempo'),
    vu: require('./window/vu'),
    projectButtons: require('./window/project_buttons'),
    qwertyKeys: require('./window/qwerty_keys.js'),
    connect: require('./window/connect.js')
  }
}

module.exports = function(target){
  return behave(behaviors, target)
}