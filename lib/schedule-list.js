module.exports = ScheduleList

function ScheduleList () {
  var scheduled = []

  scheduled.getLast = function () {
    return scheduled[scheduled.length - 1]
  }

  scheduled.truncateTo = function (pos) {
    while (scheduled[0] && scheduled[0].to && scheduled[0].to < pos) {
      destroy(scheduled.shift())
    }
  }

  scheduled.truncateFrom = function (pos) {
    while (scheduled.length && scheduled.getLast().from >= pos) {
      destroy(scheduled.pop())
    }
  }

  scheduled.destroy = function () {
    while (scheduled.length) {
      destroy(scheduled.pop())
    }
  }

  return scheduled
}

function destroy (item) {
  item.stop()
  if (Array.isArray(item.releases)) {
    item.releases.forEach(invoke, item)
  }
}

function invoke (fn) {
  return fn.apply(this)
}
