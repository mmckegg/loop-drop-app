module.exports = {
  name: 'MIDI Note',
  node: 'source/midi-out',
  group: 'sources',
  spawn: function (context) {
    // HACK: enable midi output on chunk when midi note source added
    if (context.externalChunk && context.externalChunk.midiOutputEnabled) {
      context.externalChunk.midiOutputEnabled.set(true)
    }
    return {}
  },
  object: require('./object'),
  render: require('./view')
}
