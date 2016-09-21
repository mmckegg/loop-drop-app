module.exports = Cleaner

function Cleaner (audioContext) {
  // rubbish collection day
  var pendingCleanUp = []

  var timer = setInterval(function () {
    for (var i = pendingCleanUp.length - 1; i >= 0; i--) {
      var event = pendingCleanUp[i]
      if (event.to && event.to < audioContext.currentTime) {
        event.destroy()
        pendingCleanUp.splice(i, 1)
      }
    }
  }, 500)

  pendingCleanUp.clear = function () {
    while (pendingCleanUp.length) {
      pendingCleanUp.pop().destroy()
    }
  }

  pendingCleanUp.destroy = function () {
    clearInterval(timer)
    pendingCleanUp.clear()
  }

  return pendingCleanUp
}
