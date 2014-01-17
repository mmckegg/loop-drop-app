var become = require('become')
var render = require('../../views').nodeEditor
var jsonQuery = require('json-query')
var teoria = require('teoria')

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
      return getDecibels(input) + 'dB'
    } else {
      return getDecibels(input)
    }
  },
  root: function(input){
    if (input instanceof Object){
      return getMidiNote(input.root || 'C4')
    } else {
      return getMidiNote(input)
    }
  },
  scale: function(input){
    if (input instanceof Object && input.type === 'scale'){
      return input.scale || 'major'
    }
  },
  scaleNotes: function(input){
    if (input instanceof Object && input.type === 'scale'){
      return getScale(input.root || 'C4', input.scale || 'major')
    }
  },
  join: function(input){
    if (Array.isArray(input)){
      return input.join(',')
    }
  }
}

function getGain(value) {
  if (value <= -40){
    return 0
  }
  return Math.round(Math.exp(value / 8.6858) * 1000) / 1000
}

function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 100) / 100)
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

  function get(query){
    return jsonQuery(query, this).value
  }

  window.events.on('updateActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: newObject})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){

        if (value instanceof Object && '$node' in value){
          if (value.$node){

            var target = obj[res.key]

            // ensure is specified node type
            if (!(target instanceof Object) || res.value.type !== value.type){
              obj[res.key] = target = { type: value.type }
              if (value.$valueTo){
                target[value.$valueTo] = res.value
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
    var res = jsonQuery(path, {rootContext: newObject, force: []})
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
    var res = jsonQuery(path, {rootContext: newObject})
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
    var newContent = render({get: get, rootContext: current.slot, filters: dataFilters})
    become(container, newContent, {inner: true, onChange: window.behave})
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
    if (element){
      window.events.emit('appendToActiveSlot', container.dataset.path, {type: element.dataset.type})
    }
  })
}

module.exports.select = function(element){
  element.onchange = function(){
    window.events.emit('updateActiveSlot', element.dataset.path, element.value)
  }

  function refresh(){
    element.value = element.dataset.value
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
        type: 'scale', 
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