var fs = require('fs')
var path = require('path')
var raw = {}

fs.readdirSync(__dirname).forEach(function(file) {
  var ext = path.extname(file)
  if (ext === '.imag' || ext === '.real') {
    var base = path.basename(file, ext)
    var item = raw[base] = raw[base] || {}
    item[ext.slice(1)] = fs.readFileSync(path.join(__dirname, file))
  }
})

module.exports = raw
