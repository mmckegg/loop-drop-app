module.exports = function (element, eventName, handler) {
  element.addEventListener(eventName, handler)
  return function unlisten () {
    element.removeEventListener(eventName, handler)
  }
}
