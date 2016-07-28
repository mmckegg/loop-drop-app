var h = require('lib/h')
var EditableHook = require('lib/editable-hook')

module.exports = Editable

function Editable (param, opts) {
  // opts: onChange, enabled
  return h('span', {
    hooks: [
      EditableHook(param, opts)
    ]
  })
}

Editable.edit = EditableHook.edit
