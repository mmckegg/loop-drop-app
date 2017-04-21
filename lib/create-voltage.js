module.exports = createVoltage

function createVoltage (audioContext, value) {
  if (value == null) {
    value = 1
  }

  var source = audioContext.createConstantSource()
  source.offset.value = value
  return source
}
