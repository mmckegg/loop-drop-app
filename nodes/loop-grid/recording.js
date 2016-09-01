var Observ = require('@mmckegg/mutant/value')
var ArrayGrid = require('array-grid')

module.exports = function (loopGrid) {
  var scheduler = loopGrid.context.scheduler
  var grid = loopGrid.grid
  var loopLength = loopGrid.loopLength

  var obs = Observ(ArrayGrid([], grid().shape, grid().stride))
  var lastTriggeredAt = obs.lastTriggeredAt = {}
  var recording = {}

  var releaseScheduler = scheduler.onSchedule(onSchedule)
  var removeWatcher = loopGrid.onEvent(function (data) {
    lastTriggeredAt[data.id] = data.position
  })

  obs.destroy = function () {
    releaseScheduler()
    removeWatcher()
  }

  return obs

  // / scoped

  function onSchedule (schedule) {
    var changed = false
    Object.keys(lastTriggeredAt).forEach(function (key) {
      var value = (lastTriggeredAt[key] > schedule.to - (loopLength() || 8))
      if (value !== recording[key]) {
        recording[key] = value
        changed = true
      }
    })

    if (changed) {
      var data = []
      grid().data.forEach(applyTrueIfLookup, {
        lookup: recording,
        target: data
      })
      obs.set(ArrayGrid(data, grid().shape))
    }
  }
}

function applyTrueIfLookup (value, index) {
  if (this.lookup[value]) {
    this.target[index] = true
  }
}
