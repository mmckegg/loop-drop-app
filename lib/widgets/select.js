var h = require('lib/h')
var computed = require('mutant/computed')
var MutantMap = require('mutant/map')
var when = require('mutant/when')
var watchAll = require('mutant/watch-all')

module.exports = select

function select (fn, data, opts) {
  var optionElements = opts.childNodes || MutantMap(opts.options, (option) => {
    return computed([option], optionElement)
  })

  return h('select', {
    'className': opts.flex ? '-flex' : '',
    'name': 'value',
    hooks: [
      SelectedValueHandler(fn, data, opts)
    ]
  }, [
    when(opts.includeBlank,
      h('option', {rawValue: null}, opts.includeBlank === true ? 'None' : opts.includeBlank)
    ),
    optionElements
  ])
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
  } else if (option) {
    return h('option', {rawValue: option}, option)
  }
}

function SelectedValueHandler (fn, data, opts) {
  return function (element) {
    var missingElement = h('option', {
      rawValue: opts.selectedValue
    }, [computed(opts.selectedValue, toString), ' ', opts.missingPrefix])

    element.addEventListener('change', {
      fn: fn,
      data: data,
      opts: opts,
      handleEvent: handleSelectEvent
    })

    return watchAll([opts.selectedValue, opts.options], (selected, options) => {
      var optionIndex = getValueIndex(element.options, selected)
      if (!~optionIndex) {
        element.appendChild(missingElement)
        element.selectedIndex = element.options.length - 1
      } else {
        if (element.options[optionIndex] !== missingElement && missingElement.parentNode === element) {
          element.removeChild(missingElement)
        }
        element.selectedIndex = optionIndex
      }
    }, {nextTick: true})
  }
}

function toString (value) {
  return String(value)
}

function getValueIndex (collection, item) {
  for (var i = 0; i < collection.length; i++) {
    if (collection[i].rawValue === item || (item == null && collection[i].rawValue == null)) {
      return i
    }
  }
  return -1
}

function handleSelectEvent (ev) {
  var option = ev.currentTarget.selectedOptions.item(0)
  if (option) {
    this.fn(option.rawValue)
  } else {
    this.fn(null)
  }
}
