var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var resolve = require('@mmckegg/mutant/resolve')
var Value = require('@mmckegg/mutant/value')
var toCollection = require('@mmckegg/mutant/dict-to-collection')
var MutantMap = require('@mmckegg/mutant/map')
var IdleProxy = require('@mmckegg/mutant/idle-proxy')

var Range = require('./range.js')
var extend = require('xtend')
var spawnNode = require('lib/spawn-node')
var formatParams = require('lib/format-params')

module.exports = function render (param, options) {
  var context = param.context
  var trigger = isTriggerable(param)
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
        trigger: trigger,
        mode: 'add'
      },
      action: Value(wrap)
    }, 'LFO')
  ]

  if (trigger) {
    modulatorOptions.push(
      h('option', {
        rawValue: {
          node: 'modulator/adsr'
        },
        action: Value(wrap)
      }, 'Envelope (ADSR)')
    )
  }

  var linkSelector = h('select.link', {
    'ev-change': SelectedValueHandler(param),
    'ev-click': beforeSelectionChange,
    'ev-keydown': preventDefault
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
      label: 'Add Modulator'
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

  return computed(linked, function (linked) {
    if (linked) {
      return h('ModParam -linked', {
        classList: [flexClass]
      }, [
        h('div.param', [
          h('span.title', options.title), ' ⇒ ', linked
        ]),
        linkSelector,
        h('div.sub', getSubEditors(param, {
          format: options.format
        }))
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
        h('div.sub', getSubEditors(param, {
          format: options.format
        }))
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
      } else if (nodeType === 'modulator/adsr') {
        return ADSR(item, options)
      }
    })
  })
}

function hasFeedback (context, modulator) {
  if (modulator && modulator.context) {
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
        node: node.mode
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
    setParamLink(param, { key: paramId, format: options.format })
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

    if (options.format === 'dB') {
      if (min <= 1) {
        max = 1
      } else {
        max = 0
      }
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
      value = value.minValue
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

function isTriggerable (param) {
  if (param.triggerable) {
    return true
  } else {
    var slot = param.context && param.context.slot
    return !!(
      slot && slot.triggerOn &&
      slot().id !== 'output' // HACK: should handle this better
    )
  }
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
