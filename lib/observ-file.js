var Value = require('@mmckegg/mutant/value')
var Event = require('geval')
var fs = require('fs')
var join = require('path').join
var getDirectory = require('path').dirname

module.exports = ObservFile

var readQueue = []

var caches = {}
var encodings = ['utf8', 'arraybuffer', 'buffer']

function ObservFile (path, encoding, cb) {
  encoding = encodings.includes(encoding) ? encoding : encodings[0]
  var cacheKey = encoding + ':' + path
  var cache = caches[cacheKey]
  var startValue = cache ? cache.lastValue : null
  var obs = Value(startValue)
  obs.path = Value(path)

  var broadcastClose = null
  obs.onClose = Event(function (broadcast) {
    broadcastClose = broadcast
  })

  if (!cache) {
    cache = caches[cacheKey] = {
      lastValue: null,
      fs: fs,
      refreshCallbacks: [],
      reading: true,
      writing: false,
      changed: false,
      encoding: encoding,
      path: path,
      closeTargets: [],
      targets: [],
      observers: []
    }

    readQueue.push(cache)
    setImmediate(processReadQueue)
  }

  if (typeof cb === 'function') {
    if (cache.reading) {
      cache.refreshCallbacks.push(cb)
    } else {
      setImmediate(cb)
    }
  }

  cache.closeTargets.push(broadcastClose)
  cache.targets.push(obs.set)
  cache.observers.push(obs)

  obs.set = function (value) {
    cache.lastValue = value
    cache.targets.forEach(set => set(value))
    write()
  }

  obs.refresh = function (cb) {
    cache.refreshCallbacks.push(cb)
    if (!cache.reading) {
      readQueue.push(cache)
      setImmediate(processReadQueue)
    }
  }

  obs.rename = function (newName, cb) {
    var oldPath = cache.path
    cache.path = join(getDirectory(cache.path), newName)
    delete caches[cacheKey]
    cacheKey = cache.encoding + ':' + cache.path
    caches[cacheKey] = cache
    cache.observers.forEach(o => o.path.set(cache.path))
    cache.fs.rename(oldPath, cache.path, write)
  }

  obs.delete = function (cb) {
    cache.lastValue = null
    cache.targets.forEach(set => set(null))
    cache.closeTargets.forEach(call => call())
    delete caches[cacheKey]
    cache.fs.unlink(cache.path, cb)
  }

  obs.close = function () {
    var index = cache.observers.indexOf(obs)
    if (~index) {
      cache.targets.splice(index, 1)
      cache.observers.splice(index, 1)
      if (!cache.observers.length) {
        delete caches[cacheKey]
      }
      broadcastClose()
    }
  }

  return obs

  // scoped

  function write () {
    if (cache.writing) {
      cache.changed = true
    } else {
      cache.writing = true
      cache.fs.writeFile(cache.path, cache.lastValue, onWritten)
    }
  }

  function onWritten () {
    cache.writing = false
    if (cache.changed) {
      cache.changed = false
      write()
    }
  }
}

function processReadQueue () {
  while (readQueue.length) {
    read(readQueue.shift())
  }
}

function read (item) {
  if (item.encoding === 'utf8') {
    item.fs.readFile(item.path, 'utf8', function (err, result) {
      item.reading = false
      item.lastValue = result
      item.targets.forEach(set => set(result))
      triggerCallbacks(item.refreshCallbacks, err)
    })
  } else if (item.encoding === 'arraybuffer') {
    item.fs.readFile(item.path, function (err, result) {
      item.reading = false
      result = result ? result.buffer : null
      item.lastValue = result
      item.targets.forEach(set => set(result))
      triggerCallbacks(item.refreshCallbacks, err)
    })
  } else {
    item.fs.readFile(item.path, function (err, result) {
      item.reading = false
      item.lastValue = result
      item.targets.forEach(set => set(result))
      triggerCallbacks(item.refreshCallbacks, err)
    })
  }
}

function triggerCallbacks (list, err) {
  while (list.length) {
    if (err) {
      list.shift()(err)
    } else {
      list.shift()()
    }
  }
}
