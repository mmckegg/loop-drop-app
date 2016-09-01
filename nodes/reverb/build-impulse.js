module.exports = buildImpulse

var chunkSize = 2048

var queue = []
var targets = {}

function buildImpulse (length, decay, reverse, cb) {
  var id = length + '/' + decay + '/' + reverse

  if (targets[id]) {
    targets[id].callbacks.push(cb)
  } else {
    var target = targets[id] = {
      id: id,
      callbacks: [cb],
      length: length,
      decay: decay,
      reverse: reverse,
      impulseL: new Float32Array(length),
      impulseR: new Float32Array(length)
    }
    queue.push([ target.id, 0, Math.min(chunkSize, length) ])
    setTimeout(next, 1)
  }

  return { id: id, cb: cb }
}

buildImpulse.cancel = function (identifier) {
  if (targets[identifier.id]) {
    var target = targets[identifier.id]
    var index = target.callbacks.indexOf(identifier.cb)

    if (~index) {
      target.callbacks.splice(index, 1)
    }

    if (!target.callbacks.length) {
      delete targets[identifier.id]
    }
    return true
  } else {
    return false
  }
}

function next () {
  var item = queue.shift()
  if (item) {
    var target = targets[item[0]]
    if (target) {
      var length = target.length
      var decay = target.decay
      var reverse = target.reverse
      var from = item[1]
      var to = item[2]

      var impulseL = target.impulseL
      var impulseR = target.impulseR

      for (var i = from;i < to;i++) {
        var n = reverse ? length - i : i
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay)
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay)
      }

      if (to >= length - 1) {
        ;delete targets[item[0]]
        target.callbacks.forEach(function (cb) {
          cb([target.impulseL, target.impulseR])
        })
      } else {
        queue.push([ target.id, to, Math.min(to + chunkSize, length) ])
      }
    }
  }

  if (queue.length) {
    setTimeout(next, 5)
  }
}
