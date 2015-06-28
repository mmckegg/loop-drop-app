var plist = require('bplist-parser')
var exec = require('child_process').exec
var fs = require('fs')

module.exports = function(listener) {
  if (process.platform === 'darwin') {
    return watchMac(listener)
  } else if (process.platform === 'linux') {
    exec("setxkbmap -print | awk -F\"+\" '/xkb_symbols/ {print $2}'", {encoding: 'utf8'}, function(err, result) {
      if (result) {
        listener(setxkbmap.trim())
      }
    })
  } else if (process.platform === 'win32') {
    exec('reg query "HKEY_CURRENT_USER\\Keyboard Layout\\Preload"', {encoding: 'utf8'}, function(err, result) {
      if (result) {
        var match = result.match(/\s1\s+REG_SZ\s+0000([A-F0-9]+)/i)
        if (match) {
          listener(match[1])
        }
      }
    })
  }
}

function watchMac(listener) {
  var file = process.env.HOME + '/Library/Preferences/com.apple.HIToolbox.plist'

  broadcastCurrentValue()
  var watcher = fs.watch(file, broadcastCurrentValue)

  return function unwatch() {
    watcher.close()
  }

  function broadcastCurrentValue(){
    plist.parseFile(file, function(err, result) {
      if (result) {
        try {
          listener(result[0].AppleSelectedInputSources[0]['KeyboardLayout Name'] || 'boop')
        } catch (ex) {}
      }
    })
  }
}