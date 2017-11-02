module.exports = {
  name: 'MIDI Sync Out',
  portMatch: /./,
  outputOnly: true,
  node: 'global/midi-sync-output',
  group: 'global-controllers',
  object: require('./object'),
  render: require('./view')
}
