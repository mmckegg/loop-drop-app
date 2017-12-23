var resolve = require('mutant/resolve')

module.exports = {
  name: 'External Audio Input',
  node: 'global/external-audio-input',
  group: 'global-controllers',
  object: require('./object'),
  render: require('./view')
}

module.exports.spawners = function (context) {
  var inputs = resolve(context.audioDevices.input)
  return inputs.map(device => {
    return {
      name: module.exports.name,
      node: module.exports.node,
      port: device.label
    }
  })
}
