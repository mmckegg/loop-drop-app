module.exports = function(container){
  var rms = window.context.audio.rms
  var vuL = container.querySelector('meter.\\.left')
  var vuR = container.querySelector('meter.\\.right')

  var currentValue = null
  var updating = false

  function refresh(){
    if (currentValue){
      vuL.value = Math.max(-40, getDecibels(currentValue[0]))
      vuR.value = Math.max(-40, getDecibels(currentValue[1]))
    }
    updating = false
  }

  rms.on('data', function(data){
    currentValue = data
    if (!updating){
      updating = true
      window.requestAnimationFrame(refresh)
    }
  })

}

function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 100) / 100 * 100) / 100
}