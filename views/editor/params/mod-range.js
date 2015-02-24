var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Range = require('./range.js')
var Select = require('./select.js')

var read = require('./read.js')
var QueryParam = require('loop-drop-setup/query-param')
var extend = require('xtend')

var lfoShapes = [
  ['Sine', 'sine'],
  ['Square', 'square'],
  ['Sawtooth /|', 'sawtooth'],
  ['Sawtooth |\\', 'sawtooth_i'],
  ['Triangle', 'triangle'],
]

module.exports = function(param, options){
  options = options || {}

  var value = read(param)
  var currentNode = value instanceof Object ? value.node : null

  var modulatorSpawners = [

    ['LFO', {
      node: 'modulator/lfo'
    }],

    ['ENV', {
      node: 'modulator/adsr',
      release: 0.1
    }]
  ]

  if (param.context && param.context.paramLookup){
    modulatorSpawners.push(['LNK', {
      node: 'modulator/param'
    }])
  }

  var buttons = []
  for (var i=0;i<modulatorSpawners.length;i++){
    var title = modulatorSpawners[i][0]
    var descriptor = modulatorSpawners[i][1]
    var isSelected = currentNode == descriptor.node

    if (!isSelected){
      buttons.push(h('a', {
        tabIndex: 0,
        'ev-click': mercury.event(addModulator, { param: param, descriptor: descriptor })
      }, title))
    } else {
      buttons.push(h('a -selected', {
        tabIndex: 0,
        'ev-click': mercury.event(removeModulator, { param: param })
      }, title))
    }
  }

  var modulatorElement = null
  if (value instanceof Object){
    if (value.node === 'modulator/adsr'){
      modulatorElement = ADSR(param, options)
    } else if (value.node === 'modulator/lfo'){
      modulatorElement = LFO(param, options)
    } else if (value.node === 'modulator/param'){
      modulatorElement = Link(param, options)
    }
  }

  var innerOpts = extend(options, {flex: true})

  return h('ModParam', {
    className: options.flex ? '-flex' : ''
  }, [
    Range(param, innerOpts),
    buttons, modulatorElement
  ]) 
}

function addModulator(ev){
  var value = read(ev.param)
  
  if (value instanceof Object){
    if (value.node === ev.descriptor.node){
      return
    }

    value = value.value
  }

  var newValue = extend(ev.descriptor, {value: value})
  ev.param.set(newValue)
}

function removeModulator(ev){
  var value = read(ev.param)
  if (value instanceof Object){
    ev.param.set(value.value)
  }
}

function setParam(ev){
  ev.param.set(ev.value)
}

function LFO(param, options){

  var mode = QueryParam(param, 'mode')
  var sync = QueryParam(param, 'sync')

  var isAdding = mode.read() === 'add'
  var isSyncing = sync.read()

  return h('div.sub -lfo', [

    Select(QueryParam(param, 'shape'), {
      defaultValue: 'sine',
      options: lfoShapes
    }),

    Range(QueryParam(param, 'amp'), {
      flex: true,
      defaultValue: 1,
      title: 'range',
      format: isAdding ? options.format : 'ratioExp'
    }),

    Range(QueryParam(param, 'rate'), {
      flex: true,
      defaultValue: 1,
      title: 'rate',
      format: isSyncing ? 'beat' : 'lfo'
    }),

    h('a', {
      tabIndex: 0,
      className: isSyncing ? '-selected' : '',
      'ev-click': mercury.event(setParam, {
        param: sync, 
        value: !isSyncing
      })
    }, 'S'),

    h('a', {
      tabIndex: 0,
      className: isAdding ? '-selected' : '',
      'ev-click': mercury.event(setParam, {
        param: mode, 
        value: isAdding ? 'multiply' : 'add'
      })
    }, '+')

  ])
}

function ADSR(param, options){
  return h('div.sub -adsr', [

    Range(QueryParam(param, 'attack'), {
      flex: true,
      title: 'a',
      format: 'ms'
    }),

    Range(QueryParam(param, 'decay'), {
      flex: true,
      title: 'd',
      format: 'ms'
    }),

    Range(QueryParam(param, 'sustain'), {
      flex: true,
      defaultValue: 1,
      title: 's',
      format: 'ratio'
    }),

    Range(QueryParam(param, 'release'), {
      flex: true,
      title: 'r',
      format: 'ms'
    })

  ])
}

function Link(param, options){  
  if (param.context && param.context.paramLookup){
    var paramLookup = param.context.paramLookup

    var options = [['None', '']]
    var keys = paramLookup.keys()
    for (var i=0;i<keys.length;i++){
      var p = paramLookup.get(keys[i])
      if (p.context.chunk !== param.context.chunk){
        options.push([p.id() + ' (modulator)', p.id()])
      }
    }

    return h('div.sub -link', [
      Select(QueryParam(param, 'param'), {
        defaultValue: '',
        options: options,
        flex: true
      })

    ])
  }
}