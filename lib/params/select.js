var Select = require('lib/widgets/select')
var extend = require('xtend')

module.exports = SelectParam

function SelectParam (param, opts) {
  return Select(set, param, extend(opts, {
    selectedValue: param
  }))
}

function set (value) {
  this.data.set(value)
}
