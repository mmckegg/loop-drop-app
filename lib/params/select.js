var h = require('micro-css/h')(require('virtual-dom/h'))
var read = require('lib/read')
var Select = require('lib/widgets/select')
var extend = require('xtend')

module.exports = SelectParam

function SelectParam (param, opts) {
  return Select(set, param, extend(opts, {
    value: read(param)
  }))
}

function set (value) {
  this.data.set(value)
}