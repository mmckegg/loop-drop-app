var KeyboardLayout = null

try {
  KeyboardLayout = require('keyboard-layout')
} catch (ex) {}

module.exports = function(listener) {
  if (KeyboardLayout) {
    var watcher = KeyboardLayout.observeCurrentKeyboardLayout(listener)
    return function() {
      watcher.dispose()
    }
  }
}