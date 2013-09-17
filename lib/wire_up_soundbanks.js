var Bus = require('./bus')
var Sidechain = require('../components/sidechain')

module.exports = function(audioContext, soundbanks){
  
  var sideChains = [
    Sidechain(audioContext),
    Sidechain(audioContext),
    Sidechain(audioContext),
    Sidechain(audioContext)
  ]

  var abcs = ['A', 'B', 'C', 'D']

  soundbanks.forEach(function(soundbank, i){
    soundbank.addBus('A', Bus(audioContext))
    soundbank.addBus('B', Bus(audioContext))
    soundbank.addBus('C', Bus(audioContext))
    soundbank.addBus('D', Bus(audioContext))

    soundbank.addBus('Sidechain Input', sideChains[i])

    sideChains.forEach(function(sidechain, x){
      soundbank.addBus(
        'Sidechain Dipper - ' + abcs[x], 
        sideChains[x].getDipperNode()
      )
    })

    soundbank.connect(audioContext.destination)
  })

}