//var fs = require('fs')

module.exports = function(url, context, cb){

  readFileArrayBuffer(url, function(err, data){  if(err)return cb&&cb(err)

    context.decodeAudioData(data, function(buffer){
      cb(null, buffer)
    }, function(err){
      cb(err)
    })

  })
}

module.exports.fromBlob = function(blob, context, cb){
  var reader = new window.FileReader()
  reader.onload = function(e){
    context.decodeAudioData(e.target.result, function(buffer) {
      var result = {
        buffer: buffer,
        gain: 1,
        transpose: 0,
        filePath: 'blob+' + Date.now()
      }
      cb(null, result)
    }, function(err){
      cb(err)
    })
  }
  reader.readAsArrayBuffer(blob)
}

//function toBuffer(ab) {
//  var buffer = new Buffer(ab.byteLength);
//  var view = new Uint8Array(ab);
//  for (var i = 0; i < buffer.length; ++i) {
//    buffer[i] = view[i];
//  }
//  return buffer;
//}

function readFileArrayBuffer(url, cb){
  var request = new window.XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    cb(null, request.response)
  }
  request.onerror = cb
  request.send();
}