var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var when = require('mutant/when')
var resolve = require('mutant/resolve')
var Value = require('mutant/value')
var toCollection = require('mutant/dict-to-collection')
var MutantMap = require('mutant/map')
var IdleProxy = require('mutant/idle-proxy')

var Range = require('./range.js')
var extend = require('xtend')
var spawnNode = require('lib/spawn-node')
var formatParams = require('lib/format-params')
var isTriggerable = require('lib/is-triggerable')

module.exports = function render (param, options) {
  var context = param.context
  var trigger = isTriggerable(param)

  var readMode = param.readMode || 'continuous'
  var currentValue = computed(param, v => getValueOrParam(v))
  var linked = computed(param, function (value) {
    value = getValueOrParam(value)
    if (value && value.node === 'linkParam') {
      return value.param
    } else {
      return false
    }
  })

  var modulatorOptions = [
    h('option', {
      rawValue: {
        node: 'modulator/lfo',
        trigger: trigger && readMode === 'continuous',
        mode: 'add'
      },
      action: Value(wrap)
    }, 'LFO'),
    h('option', {
      rawValue: {
        node: 'modulator/quantize'
      },
      action: Value(wrap)
    }, 'Quantizer')
  ]

  if (trigger) {
    if (readMode === 'continuous') {
      modulatorOptions.push(
        h('option', {
          rawValue: {
            node: 'modulator/adsr'
          },
          action: Value(wrap)
        }, 'Envelope (ADSR)'),
        h('option', {
          rawValue: {
            node: 'modulator/hold'
          },
          action: Value(wrap)
        }, 'Trigger Hold')
      )
    }

    modulatorOptions.push(
      h('option', {
        rawValue: {
          node: 'modulator/random',
          interpolate: isExpFormat(options.format) ? 'exp' : 'linear'
        },
        action: Value(wrap)
      }, 'Trigger Random')
    )
  }

  var linkSelector = h('select.link', {
    events: {
      change: SelectedValueHandler(param),
      click: beforeSelectionChange,
      keydown: preventDefault
    }
  }, [
    h('option', {
      action: Value(revert),
      selected: computed(currentValue, v => !(v instanceof Object))
    }, 'Specify Value'),
    options.allowSpawnModulator ? h('option', {
      rawValue: options,
      action: Value(spawnModulatorChunk)
    }, '+ Create Modulator') : null,
    param.context.externalChunk && param.context.externalChunk.spawnParam ? h('option', {
      rawValue: options,
      action: Value(spawnParam)
    }, '+ Create Param') : null,
    getParamLinkOptions(context, currentValue, options.format),
    modulatorOptions.length ? h('optgroup', {
      label: 'Inline Modulator'
    }, [
      modulatorOptions
    ]) : null
  ])

  var flexClass = computed(param, function (value) {
    if (options.flex) {
      if (options.flex === 'small' && !(value instanceof Object)) {
        return '-flexSmall'
      } else {
        return '-flex'
      }
    }
  })

  var subEditors = h('div.sub', getSubEditors(param, {
    format: options.format
  }))

  return computed(linked, function (linked) {
    if (linked) {
      return h('ModParam -linked', {
        classList: [flexClass]
      }, [
        h('div.param', [
          h('span.title', options.title), ' ⇒ ', linked
        ]),
        linkSelector,
        subEditors
      ])
    } else {
      return h('ModParam -value', {
        classList: [flexClass]
      }, [
        h('div.param', [
          Range(param, extend(options, {
            flex: true
          }))
        ]),
        linkSelector,
        subEditors
      ])
    }
  })
}

function preventDefault (ev) {
  ev.preventDefault()
}

function getParamLinkOptions (context, currentValue, format) {
  return IdleProxy(() => {
    var id = computed(currentValue, (value) => {
      return value && value.node === 'linkParam' ? value.param : null
    })

    var missing = computed([id, context.paramLookup], (id, paramLookup) => {
      return id && paramLookup[id] == null
    })

    return h('optgroup', {
      label: 'Link Param'
    }, [
      when(missing, h('option', {
        rawValue: computed([id], (key) => {
          return { key, format }
        }),
        action: Value(setParamLink),
        selected: true
      }, ['[', id, ']'])),
      MutantMap(toCollection(context.paramLookup), (item) => {
        var param = item.value
        if (!hasFeedback(context, param)) {
          return h('option', {
            rawValue: computed([id], (key) => {
              return { key: item.key, format }
            }),
            action: Value(setParamLink),
            selected: computed([id, item.key], (id, key) => id === key)
          }, [
            item.key,
            getModulatorPrefix(param)
          ])
        }
      })
    ])
  })
}

function isExpFormat (format) {
  return (format === 'arfo')
}

function getModulatorPrefix (modulator) {
  if (modulator && modulator._type === 'ModulatorChunk') {
    return ' (modulator)'
  }
}

function getSubEditors (param, options) {
  var nodes = computed(param, function (value) {
    var node = param.node
    var result = []

    while (node instanceof Object) {
      result.push(node)
      node = node.value && node.value.node
    }

    return result
  })

  return MutantMap(nodes, (item) => {
    var nodeType = computed([item], n => n.node)
    return computed([nodeType], (nodeType) => {
      if (nodeType === 'linkParam') {
        return ParamLink(item, options)
      } else if (nodeType === 'modulator/lfo') {
        return LFO(item, options)
      } else if (nodeType === 'modulator/quantize') {
        return Quantize(item, options)
      } else if (nodeType === 'modulator/random') {
        return Random(item, options)
      } else if (nodeType === 'modulator/hold') {
        return Hold(item, options)
      } else if (nodeType === 'modulator/adsr') {
        return ADSR(item, options)
      }
    })
  })
}

function hasFeedback (context, modulator) {
  if (context.node === modulator) {
    return true
  } else if (modulator && modulator.context) {
    var chunk = modulator.context.chunk
    return chunk && chunk._type === 'ModulatorChunk' && chunk === context.chunk
  }
}

function ParamLink (param, options) {
  return h('div', [

    Range(param.minValue, extend(options, {
      flex: true,
      title: 'min'
    })),

    Range(param.maxValue, extend(options, {
      flex: true,
      title: 'max'
    })),

    options.format !== 'ratio1' ? Toggle(param.quantize, {
      title: 'Round to whole number',
      caption: 'R',
      onValue: 1,
      offValue: null
    }) : null
  ])
}

function Quantize (node, options) {
  return h('div', [
    Range(node.grid, extend(options, {
      flex: true,
      title: 'quantize grid'
    })),
    Range(node.offset, extend(options, {
      flex: true,
      title: 'offset'
    })),
    h('button.remove Button -warn', {
      title: 'Remove',
      'ev-click': send(remove, node)
    }, 'X')
  ])
}

function Random (node, options) {
  var adding = computed(node.mode, v => v === 'add')

  return h('div', [

    h('a', {
      tabIndex: 0,
      title: 'Add to value (instead of scaling)',
      classList: when(adding, '-selected'),
      'ev-click': send(toggleParam, {
        onValue: 'add',
        offValue: 'multiply',
        param: node.mode
      })
    }, '+'),

    when(adding,
      LinkableRange(node.amp, {
        flex: true,
        defaultValue: 1,
        title: 'add random',
        format: options.format
      }),
      LinkableRange(node.amp, {
        flex: true,
        defaultValue: 1,
        title: 'multiply random',
        format: 'ratioExp'
      })
    ),

    h('button.remove Button -warn', {
      title: 'Remove',
      'ev-click': send(remove, node)
    }, 'X')
  ])
}

function Hold (node, options) {
  return h('div', [
    LinkableRange(node.attack, {
      flex: true,
      defaultValue: 0,
      title: 'hold attack',
      format: 'ms'
    }),

    h('button.remove Button -warn', {
      title: 'Remove',
      'ev-click': send(remove, node)
    }, 'X')
  ])
}

function LFO (node, options) {
  var adding = computed(node.mode, v => v === 'add')

  var trigger = isTriggerable(node)

  return h('div', [

    h('a', {
      tabIndex: 0,
      title: 'Add to value (instead of scaling)',
      classList: when(adding, '-selected'),
      'ev-click': send(toggleParam, {
        onValue: 'add',
        offValue: 'multiply',
        param: node.mode
      })
    }, '+'),

    when(adding,
      LinkableRange(node.amp, {
        flex: true,
        defaultValue: 1,
        title: 'add',
        format: options.format
      }),
      LinkableRange(node.amp, {
        flex: true,
        defaultValue: 1,
        title: 'multiply',
        format: 'ratioExp'
      })
    ),

    Toggle(node.sync, {
      title: 'Sync to BPM',
      caption: 'S'
    }),

    when(node.sync,
      LinkableRange(node.rate, {
        flex: true,
        defaultValue: 1,
        title: 'rate',
        format: 'beat'
      }),
      LinkableRange(node.rate, {
        flex: true,
        defaultValue: 1,
        title: 'rate',
        format: 'lfo'
      })
    ),

    trigger ? Toggle(node.trigger, {
      title: 'Retrigger',
      caption: 'T'
    }) : null,

    LinkableRange(node.skew, {
      defaultValue: 0,
      title: 'skew',
      format: 'offset1',
      flex: true
    }),

    LinkableRange(node.curve, {
      defaultValue: 1,
      title: 'curve',
      format: 'ratio1',
      flex: true
    }),

    (options.format === 'semitone' || options.format === 'octave') ? Toggle(node.quantize, {
      title: 'Round to whole number',
      caption: 'R',
      onValue: 1,
      offValue: null
    }) : null,

    h('button.remove Button -warn', {
      title: 'Remove',
      'ev-click': send(remove, node)
    }, 'X')
  ])
}

function LinkableRange (param, options) {
  var linked = computed(param, function (value) {
    if (value && value.node === 'linkParam') {
      return value.param
    } else {
      return false
    }
  })
  return computed(linked, function (linked) {
    if (linked) {
      return h('RangeParam', [
        h('div.link', [
          h('span.title', options.title), ' ⇒ ', linked
        ])
      ])
    } else {
      return Range(param, options)
    }
  })
}

function ADSR (node, options) {
  return h('div', [

    Toggle(node.retrigger, {
      title: 'Retrigger',
      caption: 'T',
      onValue: true,
      offValue: false
    }),

    LinkableRange(node.attack, {
      flex: true,
      title: 'a',
      format: 'ms'
    }),

    LinkableRange(node.decay, {
      flex: true,
      title: 'd',
      format: 'ms'
    }),

    LinkableRange(node.sustain, {
      flex: true,
      defaultValue: 1,
      title: 's',
      format: 'ratio'
    }),

    LinkableRange(node.release, {
      flex: true,
      title: 'r',
      format: 'ms'
    }),

    h('button.remove Button -warn', {
      'ev-click': send(remove, node)
    }, 'X')
  ])
}

function toggleParam (ev) {
  if (resolve(ev.param) !== ev.onValue) {
    ev.param.set(resolve(ev.onValue))
  } else {
    ev.param.set(resolve(ev.offValue))
  }
}

function remove (node) {
  if (node.context && node.context.param) {
    node.context.param.set(obtain(node.value()))
  }
}

function wrap (param, wrapper) {
  var value = resolve(param)
  param.set(extend(wrapper, {
    value: obtain(value)
  }))
}

function spawnParam (param, options) {
  var chunk = param.context.externalChunk
  if (chunk.spawnParam) {
    var paramId = chunk.spawnParam(options.title || 'New Param')
    setParamLink(param, { key: resolve(paramId), format: options.format })
  }
}

function setParamLink (param, options) {
  var formatter = formatParams[options.format] || formatParams.default
  var valueParam = getValueParam(param)

  if (valueParam() && valueParam().node === 'linkParam') {
    // switching from existing param
    valueParam.set(extend(valueParam(), {
      param: resolve(options.key)
    }))
  } else {
    var min = resolveValue(valueParam())
    var max = formatter.size(min) < 0.5
      ? formatter.value(1, 0)
      : formatter.value(0, 0)

    if (options.format === 'semitone') {
      max = min + 1
    }

    if (options.format === 'dB' || targetIsModulator(param.context, resolve(options.key))) {
      min = 0
      max = resolveValue(valueParam())
    }

    valueParam.set({
      node: 'linkParam',
      minValue: min,
      maxValue: max,
      param: resolve(options.key),
      mode: isExpFormat(options.format) ? 'exp' : 'linear'
    })
  }
}

function targetIsModulator (context, key) {
  return (context.modulatorLookup && context.modulatorLookup.get(key))
}

function spawnModulatorChunk (param, options) {
  var node = param.context.node
  var setup = param.context.setup
  var index = setup.chunks.indexOf(node) + 1 || undefined
  spawnNode(setup.chunks, 'modulatorChunk', index, function (err, chunk) {
    if (node) {
      var newId = setup.chunks.resolveAvailable(resolve(node.id) + '-' + (options.title || 'modulator'))
      var idParam = chunk.id
      idParam.set(newId)
    }

    var min = 0
    var max = 1

    if (options.format === 'semitone') {
      var currentValue = resolveValue(param())
      min = currentValue || 0
      max = min + 1
      chunk.shape.set([1, 8])
      chunk.slots.set([
        { node: 'slot/value', id: '0', value: -4 },
        { node: 'slot/value', id: '1', value: -3 },
        { node: 'slot/value', id: '2', value: -2 },
        { node: 'slot/value', id: '3', value: -1 },
        { node: 'slot/value', id: '4', value: 1 },
        { node: 'slot/value', id: '5', value: 2 },
        { node: 'slot/value', id: '6', value: 3 },
        { node: 'slot/value', id: '7', value: 4 }
      ])
    }

    setup.selectedChunkId.set(chunk.id())
    setup.context.actions.scrollToSelectedChunk()

    getValueParam(param).set({
      node: 'linkParam',
      minValue: min,
      maxValue: max,
      param: chunk.id()
    })
  })
}

function getValueParam (param) {
  while (param.node != null && param.nodeName() !== 'linkParam') {
    param = param.node.value
  }
  return param
}

function resolveValue (value) {
  while (value instanceof Object) {
    if (value.minValue != null) {
      var difference = value.maxValue - value.minValue
      // HACK: special case for modulator offsets
      if (Math.abs(difference) === 1) {
        value = value.minValue
      } else {
        value = Math.max(value.minValue, value.maxValue)
      }
    } else {
      value = value.value
    }
  }
  return value
}

function Toggle (param, options) {
  var onValue = options.onValue !== undefined ? options.onValue : true
  var offValue = options.offValue !== undefined ? options.offValue : false
  var selected = computed([param, onValue], (a, b) => a === b)

  return h('a', {
    tabIndex: 0,
    title: options.title,
    classList: when(selected, '-selected'),
    'ev-click': send(toggleParam, {
      onValue: onValue,
      offValue: offValue,
      param: param
    })
  }, options.caption)
}

function SelectedValueHandler (param) {
  return {
    param: param,
    handleEvent: handleSelectEvent
  }
}

function beforeSelectionChange (ev) {
  // nasty hacks!
  ev.currentTarget.lastSelectedIndex = ev.currentTarget.selectedIndex
}

function handleSelectEvent (ev) {
  var option = ev.currentTarget.selectedOptions.item(0)

  // undo manual selection change - let the code do it!
  ev.currentTarget.selectedIndex = ev.currentTarget.lastSelectedIndex || 0

  if (option) {
    if (option.action) {
      option.action(this.param, option.rawValue)
    } else {
      getValueParam(this.param).set(option.rawValue)
    }
  } else {
    this.param.set(null)
  }
}

function getValueOrParam (object, defaultValue) {
  if (object && object.node === 'linkParam') {
    return object
  } else if (object instanceof Object && !Array.isArray(object)) {
    return getValueOrParam(object.value, defaultValue)
  } else {
    return object != null ? object : defaultValue
  }
}

function revert (param) {
  var valueParam = getValueParam(param)
  valueParam.set(resolveValue(valueParam()))
}

function obtain (obj) {
  return JSON.parse(JSON.stringify(obj))
}
