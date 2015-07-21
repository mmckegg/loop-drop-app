module.exports = function(fn, data, opts){
  var handler = {
    handleEvent: handle
  }
  return handler;
}

function handle(ev){
  ev.preventDefault()
}