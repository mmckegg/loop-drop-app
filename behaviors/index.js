var behave = require('dom-behavior')

var behaviors = {
  'slot': {
    selector: require('./slot/selector'),
    drag: require('./slot/drag'),
    fill: require('./slot/fill')
  },
  'editor': {
    raw: require('./editor/raw'),
    nodes: require('./editor/nodes'),
    sampleTrimmer: require('./editor/sample_trimmer')
  },
  'deck': {
    selected: require('./deck/selected'),
    kits: require('./deck/kits'),
    control: require('./deck/control')
  },
  'project': require('./project'),
  'engine': require('./engine')
}

module.exports = function(target){
  return behave(behaviors, target)
}