var h = require('micro-css/h')(require('virtual-dom/h'))
var ValueEvent = require('lib/value-event')
var read = require('lib/read')

module.exports = select

function select(fn, data, opts){
  var value = opts.selectedValue

  var options = typeof opts.options == 'function' ? opts.options() : opts.options
  options = Array.isArray(options) ? options : []
  var optionElements = options.map(optionElement)

  if (value){
    if (!markSelectedOption(optionElements, value)){
      var display = String(value)
      if (opts.missingPrefix){
        display += opts.missingPrefix
      }
      optionElements.unshift(h('option', {rawValue: value, selected: true}, display))
    }
  }

  if (opts.includeBlank){
    var display = opts.includeBlank === true ? 'None' : opts.includeBlank
    optionElements.unshift(h('option', {rawValue: null}, display))
  }

  return h('select', {
    'name': 'value', 'ev-change': SelectedValueHandler(fn, data, opts)
  }, optionElements)
}

function optionElement(option){
  if (Array.isArray(option)){
    if (Array.isArray(option[1])){
      return h('optgroup', {
        label: option[0]
      }, option[1].map(optionElement))
    }
    return h('option', {rawValue: option[1]}, option[0])
  } else {
    return h('option', {rawValue: option}, option)
  }
}

function markSelectedOption(options, selectedValue){
  for (var i=0;i<options.length;i++){
    var option = options[i]
    if (option.properties && option.properties.rawValue == selectedValue){
      option.properties.selected = true
      return true
    }
    if (option.children && option.children.length){
      var res = markSelectedOption(option.children, selectedValue)
      if (res){
        return true
      }
    }
  }
}

function SelectedValueHandler(fn, data, opts) {
  return {
    fn: fn,
    data: data,
    opts: opts,
    handleEvent: handleSelectEvent
  }
}

function handleSelectEvent(ev) {
  var option = ev.currentTarget.selectedOptions.item(0)
  if (option) {
    this.fn(option.rawValue)
  } else {
    this.fn(null)
  }
}
