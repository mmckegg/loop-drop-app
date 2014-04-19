var become = require('become')
var render = require('../../views').nodeEditor
var jsonQuery = require('json-query')
var teoria = require('teoria')
var frac = require('frac')

var relativeQuery = /^[\.\[:]/

var dataFilters = {
  path: function(input, params){
    var result = ''
    if (input){
      result = this.query
      if (this.parentContext && relativeQuery.exec(result)){
        result = dataFilters.path.call(this.parentContext, this.parentContext.source) + result
      }
      var root = input
      if (params && params.args){
        for (var i=0;i<params.args.length;i++){
          if (root instanceof Object){
            var arg = params.args[i]
            if (result){
              result += '.' + arg
            } else {
              result = arg
            }
            root = root[arg]
          }
        }
      }

    }
    return result
  },
  activeClass: function(input, params){
    if (input){
      return params.args.join(' ') + ' -active'
    } else {
      return params.args.join(' ')
    }
  },
  format: function(input, params){
    if (this.query === '.amp'){
      return 'dB'
    } else if (this.query === '.rate'){
      return 'lfo'
    } else if (this.query === '.frequency'){
      return 'arfo'
    } else if (this.query === '.transpose'){
      return 'semitone'
    } else {
      return 'ratio'
    }
  },
  text: function(input, params){
    return params.args[0]
  },
  isLinked: function(input){
    return input && input.$
  },
  dB: function(input, params){
    if (input instanceof Object){
      input = input.value
    }

    if (input == null){
      input = 1
    }

    if (params.args[0]){
      return String(getDecibels(input)).replace(/Infinity/, "\u221e") + ' dB'
    } else {
      return getDecibels(input)
    }
  },
  hz: function(input, params){
    if (input instanceof Object){
      input = input.value
    }

    if (input == null){
      input = 0
    }

    if (params.args[0]){
      if (input > 1000){
        return round(input/1000, 2) + ' kHz'
      } else {
        return round(input) + ' hz'
      }
    } else {
      return input
    }
  },
  ms: function(input, params){
    if (input instanceof Object){
      input = input.value
    }

    if (input == null){
      input = 0
    }

    if (params.args[0]){
      if (input >= 1){
        return round(input,1) + ' s'
      } else {
        return round(input*1000) + ' ms'
      }
    } else {
      return input
    }
  },
  beat: function(input, params){
    if (input instanceof Object){
      input = input.value
    }

    if (input == null){
      input = 1
    }

    if (params.args[0]){
      if (input >= 1){
        return round(input,1)
      } else {
        var f = frac(input, 32)
        return f[1] + '/' + f[2]
      }
    } else {
      return input
    }
  },
  root: function(input){
    if (input instanceof Object){
      return getMidiNote(input.root || 'C5')
    } else {
      return getMidiNote(input)
    }
  },
  scale: function(input){
    if (input instanceof Object && input.node === 'scale'){
      return input.scale || 'major'
    }
  },
  scaleNotes: function(input){
    if (input instanceof Object && input.node === 'scale'){
      return getScale(input.root || 'C4', input.scale || 'major')
    }
  },
  join: function(input){
    if (Array.isArray(input)){
      return input.join(',')
    }
  },
  selectedClass: function(input){
    if (input){
      return '-selected'
    }
  }
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}

function getGain(value) {
  if (value <= -40){
    return 0
  }
  return Math.round(Math.exp(value / 8.6858) * 1000) / 1000
}

function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 1000) / 1000)
}

function getMidiNote(note){
  if (typeof note === 'string'){
    return teoria.note(note).key()+20
  } else {
    return note
  }
}

function getScale(root, scaleName){
  if (scaleName){
    var rootNote = typeof root === 'number' ? teoria.note.fromMIDI(root) : teoria.note(root)
    return rootNote.scale(scaleName).notes().map(getDegree)
  } else {
    return []
  }
}

function getDegree(note){
  return (note.key()-4) % 12
}

module.exports = function(container){
  var currentDeck = null
  var current = {
    slot: null,
    id: null,
    deckId: null
  }

  window.events.on('setEditorView', function(view){
    container.hidden = (view !== 'visual')
  })

  window.events.on('selectSlot', function(deckId, slotId){

    current.deckId = deckId
    current.id = String(slotId)

    var deck = window.context.instances[deckId]
    if (deck != currentDeck){
      if (currentDeck){
        deck.removeListener('change', handleData)
      }
      currentDeck = deck
      currentDeck.on('change', handleData)
    }

    current.slot = deck.getDescriptor(slotId)
    update()
  })

  function get(query, source){
    if (source != null){
      var context = Object.create(this)
      context.parentContext = this
      context.source = source
      return jsonQuery(query, context).value
    } else {
      return jsonQuery(query, this).value
    }
  }

  window.context.editor = {get: get, rootContext: current, filters: dataFilters}

  window.events.on('toggleActiveSlot', function(path){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: {slot: newObject}})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){
        if (obj[res.key]){
          obj[res.key] = false
        } else {
          obj[res.key] = true
        }

        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  window.events.on('updateActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: {slot: newObject}})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){

        if (value instanceof Object && '$node' in value){
          if (value.$node == 'match'){

            if (obj[res.key] && !Array.isArray(obj[res.key]) && obj[res.key] instanceof Object){
              obj[res.key].value = value.value
            } else {
              obj[res.key] = value.value
            }

          } else if (value.$node){

            var target = obj[res.key]

            // ensure is specified node type
            if (!(target instanceof Object) || res.value.node !== value.node){
              obj[res.key] = target = { node: value.node }
              if (value.$valueTo){

                if (!Array.isArray(res.value) && typeof res.value == 'object'){
                  target[value.$valueTo] = res.value.value
                } else {
                  target[value.$valueTo] = res.value
                }

              }
            }

            // update node params
            Object.keys(value).forEach(function(key){
              if (typeof key !== 'string' || key.charAt(0) !== '$'){
                target[key] = value[key]
              }
            })

          } else if (res.value instanceof Object) { // revert to ordinary node
            obj[res.key] = res.value[value.$valueFrom || 'value']
          }
        } else {
          obj[res.key] = value
        }

        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  window.events.on('appendToActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: {slot: newObject}, force: []})
    if (res.key != null){

      var obj = res.value
      if (Array.isArray(obj)){
        obj.push(value)
        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  window.events.on('deleteFromActiveSlot', function(path){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: {slot: newObject}})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){
        if (Array.isArray(obj)){
          obj.splice(res.key, 1)
        } else {
          delete obj[res.key]
        }
        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  function update(){
    if (window.noRefresh) return false

    var newContent = render(window.context.editor)
    become(container, newContent, {inner: true, onChange: window.behave, tolerance: 0})
  }

  function handleData(data){
    var activeEditor = getNodeEditorElement(document.activeElement)
    if (data.id == current.id){
      current.slot = data
      if (activeEditor !== container || !activeEditor.classList.contains('-noRefresh')){
        update()
      }
    }
  }
}

module.exports.deleteButton = function(element){
  element.onclick = function(e){
    var nodeElement = getNodeElement(e.target)
    if (nodeElement){
      var path = nodeElement.dataset.path
      window.events.emit('deleteFromActiveSlot', path)
    }
  }
}

module.exports.spawner = function(container){
  container.addEventListener('click', function(e){
    var element = getLink(e.target)
    if (element && element.dataset.node){
      var object = {node: element.dataset.node}
      if (object.node === 'oscillator'){
        object.amp = 0.6
        object.note = 72
        object.frequency = 440
      }

      if (object.node === 'filter'){
        object.frequency = 350
      }
      window.events.emit('appendToActiveSlot', container.dataset.path, object)
    }
  })
}

module.exports.toggle = function(element){
  element.onclick = function(){
    window.events.emit('toggleActiveSlot', element.dataset.path)
  }
}

module.exports.select = function(element){
  element.onchange = function(){
    window.events.emit('updateActiveSlot', element.dataset.path, element.value)
  }

  function refresh(){
    element.value = element.dataset.value || ''
  }

  refresh()
  return refresh
}

module.exports.scaleSelector = function(element){
  element.onchange = function(){
    if (element.value){
      window.events.emit('updateActiveSlot', element.dataset.path, {
        $node: true, 
        $valueTo: 'root',
        node: 'scale', 
        scale: element.value
      })
    } else {
      window.events.emit('updateActiveSlot', element.dataset.path, {
        $node: false, 
        $valueFrom: 'root'
      })
    }
  }

  function refresh(){
    element.value = element.dataset.value || ''
  }

  refresh()

  return refresh
}

function getNodeEditorElement(node){
  while (node && !node.classList.contains('NodeEditor')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function getNodeElement(node){
  while (node && !node.classList.contains('Node')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function getLink(node){
  while (node && !node.nodeName === 'A'){
    node = node.parentNode
  }
  return node
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}