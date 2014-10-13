var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('../collection.js')

var chunkOptions = require('./options.js')

module.exports = renderChunk

function renderChunk(fileObject){
  if (fileObject){
    console.log("CHUJ")
    return h('ChunkNode', [
      chunkOptions(fileObject)
    ])
  }
}