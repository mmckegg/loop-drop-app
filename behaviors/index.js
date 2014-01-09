var behave = require('dom-behavior')

var behaviors = {
  'slot': {
    selector: require('./slot/selector'),
    drag: require('./slot/drag'),
    fill: require('./slot/fill')
  },
  'editor': {
    raw: require('./editor/raw')
  },
  'deck': {
    selected: require('./deck/selected'),
    kits: require('./deck/kits')
  },
  'project': require('./project')
}

module.exports = function(target){
  return behave(behaviors, target)
}