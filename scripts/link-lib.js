var fs = require('fs')
var join = require('path').join

process.cwd(join(__dirname, '..'))
fs.symlink(join('..','lib'), join('node_modules', 'lib'), 'dir', function(err) {
  if (!err) {
    console.log('node_modules/lib -> lib')
  }
})