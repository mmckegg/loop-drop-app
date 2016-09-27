module.exports = CallbackWorker

function CallbackWorker (fn) {
  var callbacks = {}
  var count = 0

  var worker = new global.Worker(global.URL.createObjectURL(
    new global.Blob([`(${WorkerProcess.toString()})(this, ${fn.toString()})`])
  ))

  worker.onmessage = function (e) {
    if (callbacks[e.data.id]) {
      callbacks[e.data.id](e.data.error, e.data.result)
      delete callbacks[e.data.id]
    }
  }

  return function (arg, cb) {
    callbacks[count] = cb
    worker.postMessage({arg, id: count})
    count += 1
  }
}

function WorkerProcess (worker, fn) {
  worker.onmessage = function (e) {
    var id = e.data.id
    fn(e.data.arg, cb)
    function cb (err, result, transferables) {
      worker.postMessage({err, result, id}, transferables)
    }
  }
}
