var fs = require('fs')
var ejs = require('ejs')
var Path = require('path')

module.exports = ejs.compile(fs.readFileSync(Path.join(__dirname, 'template.ejs'), 'utf8'))
