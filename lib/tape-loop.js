var inherits = require('util').inherits;
var Writable = require('stream').Writable;

var Writer = require('wav').Writer

module.exports = TapeLoop

function TapeLoop(fileOrFiles, opts){

  if (!(this instanceof TapeLoop)) {
    return new TapeLoop(fileOrFiles, opts);
  }

  var isMulti = Array.isArray(fileOrFiles)
  Writable.call(this, { objectMode: isMulti });

  var self = this

  var sampleRate = opts && opts.sampleRate || 44100
  self._maxLength = opts && opts.length || ((sampleRate * 60) * 4)
  self._offset = opts && opts.offset || 0
  self._readyToWrite = false

  function handleError(error){
    console.error(error)
    self.emit('error', error)
  }

  var header = getHeader(opts)

  this._dataStart = header.length

  var files = isMulti ? fileOrFiles : [fileOrFiles]
  self._writers = new Array(files.length)

  forEach(files, function(file, next, i){

    // prepare the stream
    file.createWriter(function(writer){
      writer.onerror = handleError
      self._writers[i] = writer
      writeHeader()

      function writeHeader(){
        console.debug('tapeloop: writing header')
        writer.onwriteend = truncate
        var blob = new Blob([header]);
        writer.write(blob)
      }

      function truncate(){
        finish()
        var length = self._maxLength+self._dataStart
        console.debug('tapeloop: truncating to ' + (length / 1024 / 1024).toFixed(2) + ' MB')
        writer.onwriteend = finish
        writer.truncate(length)
      }

      function finish(){
        next()
      }
    }, handleError)

  }, start)

  this._resumeReading = function(){}

  function start(){
    self._readyToWrite = true
    self._processChunk()
  }

}

inherits(TapeLoop, Writable);

TapeLoop.prototype._write = function (chunk, enc, next) {
  this._nextChunk = chunk
  this._resumeReading = next
  if (this._readyToWrite){
    this._processChunk()
  }
}

TapeLoop.prototype._processChunk = function(){
  var self = this

  if (this._nextChunk){
    var pendingWrites = 0
    var chunk = this._nextChunk
    var next = this._resumeReading
    this._resumeReading = null
    this._nextChunk = null

    function writeEnd(){
      pendingWrites -= 1
      if (pendingWrites === 0){
        next()
      }
      self.emit('offset', self._offset)
    }

    var chunks = Array.isArray(chunk) ? chunk : [chunk]
    var offset = this._offset
    this._offset += chunks[0].length 

    // handle boundry point
    if (this._offset >= this._maxLength){
      var remain = this._maxLength - this._offset
      if (remain){
        this._nextChunk = slice(chunks, -remain)
        chunks = slice(chunks, 0, -remain)
      }
      this._offset = 0
    }

    for (var i=0;i<this._writers.length;i++){
      if (chunks[i]){
        var writer = this._writers[i]
        pendingWrites += 1
        writer.onwriteend = writeEnd

        var blob = new Blob([chunks[i]])
        writer.seek(offset + this._dataStart)
        writer.write(blob)
        console.debug('write', i)
      }
    }

  }
}

function slice(chunks, start, end){
  var result = new Array(chunks.length)
  for (var i=0;i<result.length;i++){
    result[i] = chunks[i].slice(start, end)
  }
  return result
}

function getHeader(opts){

  var result = null
  var wrapper = {
    endianness: 'LE',
    format: 1, // raw PCM
    channels: 2,
    sampleRate: 44100,
    bitDepth: 16,
    dataLength: 0,
    writeHeader: Writer.prototype._writeHeader,
    push: function(header){
      result = header
    }
  }

  if (opts) {
    if (null != opts.format) wrapper.format = opts.format;
    if (null != opts.channels) wrapper.channels = opts.channels;
    if (null != opts.sampleRate) wrapper.sampleRate = opts.sampleRate;
    if (null != opts.bitDepth) wrapper.bitDepth = opts.bitDepth;
    if (null != opts.length) wrapper.dataLength = opts.length;
  }

  wrapper.writeHeader()
  return result
}

function forEach(array, fn, cb){
  var i = -1
  function next(err){
    if (err) return cb&&cb(err)
    i += 1
    if (i<array.length){
      fn(array[i], next, i)
    } else {
      cb&&cb(null)
    }
  }
  next()
}