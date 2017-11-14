module.exports = {
  name: 'Chromatic (monophonic)',
  node: 'chunk/scale-mono',
  group: 'chunks',
  description: 'Monophonic version of chromatic chunk.',
  spawn: false, // spawned via chunk/scale
  external: true,
  renderExternal: require('../chromatic-chunk/external'),
  render: require('../chromatic-chunk/view'),
  object: require('./object')
}
