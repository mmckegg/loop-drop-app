var Overdrive = require('../components/overdrive')

module.exports = function(audioContext){

  var input = audioContext.createGainNode()
  var output = audioContext.createGainNode()

  var overdrive = new Overdrive(audioContext, {
    preBand: 1.0,
    color: 4000,
    drive: 0.8,
    postCut: 8000
  })

  connect([input, overdrive, output])

  return {
    overdrive: overdrive,
    name: 'Distortion',
    input: input,
    output: output
  }
}

function connect(sources){
  sources.forEach(function(to, i){
    if (i>0){
      var from = sources[i-1]
      ;(from.output || from).connect(to.input || to)
    }
  })
}