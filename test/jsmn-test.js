var JSMN = require('../lib/jsmn')
var test = require('tape')

test('stringify', function(t){
  t.equal(JSMN.stringify({string: "good", number: 123}), 'string: "good", number: 123')
  t.equal(
    JSMN.stringify({string: "good", number: 123, more: {$: '100 / 4 * 3'}, obj: { thing: "some long text", ary: [1,2,3]}}), 
    'string: "good",\nnumber: 123,\nmore: {{100 / 4 * 3}},\nobj: {\n  thing: "some long text",\n  ary: [ 1, 2, 3 ]\n}'
  )
  t.end()
})

test('parse', function(t){
  var obj = {
    string: "good", 
    number: 123, 
    more: {$: '100 / 4 * 3'},
    multi: {$: 'chord("maj", 50).map(function(x){\n  merge(source, {pitch: x})\n})'},
    obj: { 
      thing: "some long text", 
      ary: [1,2,3]
    }
  }

  t.deepEqual(JSMN.parse(JSMN.stringify(obj)), obj)
  t.end()
})

test('eval', function(t){
  var obj = {num: 123, ary: [1,2, {$: '2'}], obj: {test: 123, val: {$: 'val + 3'} }}
  var context = {val: 5}
  var expected = { num: 123, ary: [ 1, 2, 2 ], obj: { test: 123, val: context.val + 3 } }
  t.deepEqual(JSMN.eval(obj, context), expected)
  t.end()
})