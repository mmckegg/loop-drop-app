// writes current keyboard layout to stdout

try {
  var KeyboardLayout = require('keyboard-layout')
  console.log(KeyboardLayout.getCurrentKeyboardLayout())
} catch (ex) {
  console.log('unknown')
}

process.exit()