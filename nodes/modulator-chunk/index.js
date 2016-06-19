module.exports = {
  name: 'Modulator',
  group: 'modifierChunks',
  node: 'modulatorChunk',
  description: 'Modulate parameters on other chunks.',
  spawn: {
    flags: ['freezeSuppress']
  },
  object: require('./object'),
  render: require('./view')
}
