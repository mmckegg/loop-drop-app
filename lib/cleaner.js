module.exports = Cleaner

function Cleaner (audioContext) {
  // rubbish collection day
  var pendingCleanUp = []

  var timer = setInterval(function () {
    for (var i = pendingCleanUp.length - 1; i >= 0; i--) {
      var event = pendingCleanUp[i]
      // HACK: if the offset is less than 0.3, cancelled chokes may still be muted
      if (event.to && event.to < (audioContext.currentTime - 0.3)) {
      // if (event.to && event.to < audioContext.currentTime) {
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
