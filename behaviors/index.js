var behave = require('dom-behavior')

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
  'project': require('./project'),
  'engine': require('./engine'),
  'window': {
    tempo: require('./window/tempo'),
    vu: require('./window/vu'),
    projectButtons: require('./window/project_buttons'),
    qwertyKeys: require('./window/qwerty_keys.js')
  }
}

module.exports = function(target){
  return behave(behaviors, target)
}