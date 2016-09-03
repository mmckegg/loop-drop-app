module.exports = ScheduleList

function ScheduleList (context) {
  var list = []
  var disconnectedTo = 0
  context.scheduler.onSchedule(function (schedule) {
    disconnectTo(schedule.time)
  })

  return {
    getLast: function () {
      return list[list.length - 1]
    },
    push: function (event) {
      list.push(event)
    },
    destroy: function () {
      while (list.length) {
        destroy(list.pop())
      }
    }
  }

  // scoped

  function disconnectTo (time) {
    for (var i = disconnectedTo; i < list.length; i++) {
      var event = list[i]
      if (event.to < time) {
        destroy(event)
      } else {
        break
      }
      disconnectedTo = i
    }
  }
}

function destroy (item) {
  item.choker.disconnect()
  if (Array.isArray(item.releases)) {
    item.releases.forEach(invoke, item)
  }
}

function invoke (fn) {
  return fn.apply(this)
}
