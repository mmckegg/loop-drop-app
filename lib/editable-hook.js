var resolve = require('mutant/resolve')
var watch = require('mutant/watch')
var editing = null
var lookup = new WeakMap()

module.exports = EditableHook

function EditableHook (param, opts) {
  return function (element) {
    var handler = Object.create(proto)
    handler.param = param
    handler.onChange = opts.onChange
    handler.formatter = opts.formatter
    handler.enabled = opts && opts.enabled != null ? opts.enabled : true
    handler.element = element
    lookup.set(param, handler)
    var releases = [
      bind(element, ['mousedown', 'mouseup', 'dblclick', 'blur', 'keydown'], handler),
      watch(param, function (value) {
        if (editing !== param) {
          element.textContent = value
        }
      })
    ]
    return function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  }
}

EditableHook.edit = function (obs, cb) {
  setTimeout(function () {
    var hook = lookup.get(obs)
    if (hook) {
      hook.edit(cb)
    }
  }, 50)
}

var proto = {
  edit: function (cb) {
    if (editing !== this.param && resolve(this.enabled)) {
      this.element.contentEditable = true
      editing = this.param
      this.element.textContent = resolve(this.param)
      selectInside(this.element)
    }
  },
  save: function save () {
    if (editing === this.param) {
      editing = null
      this.lastValue = resolve(this.param)
      this.value = this.element.textContent.trim()

      this.element.contentEditable = false
      clearSelection()

      if (this.value !== this.lastValue) {
        this.param.set(this.value)
        if (this.onChange) {
          this.onChange(this.lastValue, resolve(this.param), this.param)
        }
      }
    }
  },
  cancel: function () {
    if (editing === this.param) {
      this.element.textContent = resolve(this.param)
      this.element.contentEditable = false
      clearSelection()
      editing = null
    }
  },
  handleEvent: function (ev) {
    if (ev.type === 'mousedown') {
      this.mousedownAt = Date.now()
    } else if (ev.type === 'mouseup') {
      // only start editing on mouseup if mousedown was within 500 ms
      if (Date.now() - this.mousedownAt < 500) {
        this.edit()
      }
    } else if (ev.type === 'dblclick') {
      ev.stopPropagation()
    } else if (ev.type === 'keydown') {
      if (ev.keyCode === 13) { // enter
        this.save()
        ev.stopPropagation()
        ev.preventDefault()
      } else if (ev.keyCode === 27) { // esc
        this.cancel()
      }
    } else if (ev.type === 'blur') {
      this.save()
    }
  }
}

function bind (target, events, handler) {
  events.forEach(function (event) {
    target.addEventListener(event, handler, true)
  })

  return function () {
    events.forEach(function (event) {
      target.removeEventListener(event, handler, true)
    })
  }
}

function selectInside (element) {
  var range = document.createRange()
  range.selectNodeContents(element)
  var sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

function clearSelection () {
  var sel = window.getSelection()
  sel.removeAllRanges()
}
