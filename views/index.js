var mercury = require('mercury')
var h = mercury.h

module.exports = function(element, state, actions){

  var setupBrowser = require('./browser.js')(state.setups, actions.setups)
  var chunkBrowser = require('./browser.js')(state.chunks, actions.chunks)
  var setupEditor = require('./tabbed-editor.js')(state.setups, actions.setups)
  var chunkEditor = require('./tabbed-editor.js')(state.chunks, actions.chunks)

  mercury.app(element, state, function(data){
    return h('div.Holder', [
      h('div', {className: '.browser'}, [
        setupBrowser('Setups'),
        chunkBrowser('Chunks')
      ]),
      h('div', {className: '.main'}, [
        setupEditor(),
        chunkEditor()
      ])
    ])
  })
  
}