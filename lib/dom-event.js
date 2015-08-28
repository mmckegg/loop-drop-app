module.exports = function(fn, data, opts){
  var handler = {
    handleEvent: fn,
    data: data,
    opts: opts
  }
  return handler;
}