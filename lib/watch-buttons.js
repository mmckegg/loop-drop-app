module.exports = watchButtons

function watchButtons(buttons, handlers){
  var removeListeners = Object.keys(handlers).map(watch, {buttons: buttons, handlers: handlers})
  return function unwatch(){
    removeListeners.forEach(invoke)
    removeListeners.length = 0
  }
}

function watch(key){
  var button = this.buttons[key]
  var handler = this.handlers[key]
  if (typeof button === 'function' && typeof handler === 'function'){
    return button(handler.bind(button))
  }
}

function invoke(fn){
  if (typeof fn === 'function'){
    return fn()
  }
}