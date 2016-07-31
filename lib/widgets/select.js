var h = require('lib/h')
var computed = require('@mmckegg/mutant/computed')

module.exports = select

function select (fn, data, opts) {
  var value = opts.selectedValue

  var optionElements = opts.childNodes || computed([value, opts.options, opts.includeBlank, opts.missingPrefix], function (value, options, includeBlank, missingPrefix) {
    var result = options.filter(present).map(optionElement)

    if (value) {
      if (!markSelectedOption(result, value)) {
        var display = String(value)
        if (missingPrefix) {
          display += missingPrefix
        }
        result.unshift(h('option', {rawValue: value, selected: true}, display))
      }
    }

    if (opts.includeBlank) {
      var display = includeBlank === true ? 'None' : includeBlank
      result.unshift(h('option', {rawValue: null}, display))
    }

    return result
  })

  return h('select', {
    'className': opts.flex ? '-flex' : '',
    'name': 'value',
    'ev-change': SelectedValueHandler(fn, data, opts)
  }, optionElements)
}

function optionElement (option) {
  if (Array.isArray(option)) {
    if (Array.isArray(option[1])) {
      return h('optgroup', {
        label: option[0]
      }, option[1].map(optionElement))
    }
    return h('option', {rawValue: option[1]}, option[0])
  } else if (option instanceof window.Element) {
    return option
  } else {
    return h('option', {rawValue: option}, option)
  }
}

function present (value) {
  return value != null
}

function markSelectedOption (options, selectedValue) {
  for (var i = 0; i < options.length; i++) {
    var option = options[i]
    if (option && option.rawValue === selectedValue) {
      option.selected = true
      return true
    }
    if (option.childNodes && option.childNodes.length) {
      var res = markSelectedOption(option.childNodes, selectedValue)
      if (res) {
        return true
      }
    }
  }
}

function SelectedValueHandler (fn, data, opts) {
  return {
    fn: fn,
    data: data,
    opts: opts,
    handleEvent: handleSelectEvent
  }
}

function handleSelectEvent (ev) {
  var option = ev.currentTarget.selectedOptions.item(0)
  if (option) {
    this.fn(option.rawValue)
  } else {
    this.fn(null)
  }
}
