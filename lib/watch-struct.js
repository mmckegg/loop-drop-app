module.exports = watchStruct

function watchStruct(struct, handlers){
  var removeListeners = Object.keys(handlers).map(watch, {struct: struct, handlers: handlers})
  return function unwatch(){
    removeListeners.forEach(invoke)
    removeListeners.length = 0
  }
}

function watch(key){
  var obs = this.struct[key]
  var handler = this.handlers[key]
  if (typeof obs === 'function' && typeof handler === 'function'){
    return obs(handler.bind(obs))
  }
}

function invoke(fn){
  if (typeof fn === 'function'){
    return fn()
  }
}