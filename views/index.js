var mercury = require('mercury')
var h = mercury.h

module.exports = function(element, state){

  var setupBrowser = require('./browser.js')(state.setupBrowser)
  var chunkBrowser = require('./browser.js')(state.chunkBrowser)
  var setupEditor = require('./tabbed-editor.js')(state.setups)
  var chunkEditor = require('./tabbed-editor.js')(state.chunks)

  mercury.app(element, state, function(data){
    return h('div.Holder', [
      h('div', {className: '.browser'}, [
        setupBrowser(),
        chunkBrowser()
      ]),
      h('div', {className: '.main'}, [
        setupEditor(),
        chunkEditor()
      ])
    ])
  })
  
}