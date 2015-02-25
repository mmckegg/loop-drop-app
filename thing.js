var audioContext = new AudioContext()
var flat = new Float32Array([1,1])

var res = 1000
var max = Math.log(20000)/Math.log(10)
var log = new Float32Array(res)
for (var i=0;i<log.length;i++){
  log[i] = Math.pow(10, max * (i/res))
}

var output = audioContext.createGain()
var voltage = getVoltage(audioContext)

voltage.start()

var multiplier = scale(voltage)
multiplier.gain.value = 1

multiplier.connect(log.gain)

log.connect(output)

monitor(output)


function monitor(node){
  window.m = node.context.createScriptProcessor(4096, 1, 1)
  window.m.onaudioprocess = function(e){
    console.log(e.inputBuffer.getChannelData(0)[0])
  }
  node.connect(window.m)
  window.m.connect(node.context.destination)
}

function getVoltage(context){
  var voltage = context.createBufferSource()
  var buffer = context.createBuffer(1, 2, context.sampleRate)
  buffer.getChannelData(0).set(flat)
  voltage.buffer = buffer
  voltage.loop = true
  return voltage
}

function scale(node){
  var gain = node.context.createGain()
  node.connect(gain)
  return gain
}