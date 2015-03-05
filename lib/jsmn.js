var safeEval = require('notevil')

module.exports.parse = function(literal){
  literal = literal.replace(/\{\{([\w\W]*?)\}\}/g, function(_, exp){
    return '{$: ' + JSON.stringify(fixIndent(exp)) + '}'
  })
  return safeEval('j = {' + literal + '}')
}

module.exports.stringify = function(object){
  return getObjectContent(object).trim()
}

module.exports.eval = xval

function xval(object, context){
  if (Array.isArray(object)){
    return object.map(function(x){
      return xval(x, context)
    })
  } else if (object instanceof Object) {
    if (object.$){
      return safeEval(object.$, context)
    } else {
      var res = {}
      Object.keys(object).forEach(function(key){
        res[key] = xval(object[key], context)
      })
      return res
    }
  } else {
    return object
  }
}

function getObjectContent(object){
  var result = Object.keys(object).map(function(key){
    return escapeKey(key) + ': ' + getLiteral(object[key])
  })
  return smartWrap(result)
}

var numberMatch = /^[0-9]/

function isNumeric(key){
  return typeof key === 'string' && !!numberMatch.exec(key)
}

function escapeKey(key){
  if (~key.indexOf(' ') || ~key.indexOf('"') || ~key.indexOf('-') || isNumeric(key)){
    return JSON.stringify(String(key))
  } else {
    return key
  }
}

function getArrayContent(array){
  var result = array.map(function(obj){
    return getLiteral(obj)
  })
  return smartWrap(result)
}

function smartWrap(array){
  if (array.join(', ').length>50){
    return '\n' + array.join(',\n') + '\n'
  } else {
    return ' ' + array.join(', ') + ' '
  }
}

function indent(text){
  return text.replace(/\n(.)/g, '\n  $1')
}

function getLiteral(value){
  if (!value || typeof value !== 'object'){
    return JSON.stringify(value)
  } else if (Array.isArray(value)){
    return '[' + indent(getArrayContent(value)) + ']'
  } else if (value && '$' in value){
    return '{{' + value['$'] + '}}'
  } else {
    return '{' + indent(getObjectContent(value)) + '}'
  }
}

var matchStartSpace = /^(\s+)/
var matchNewLineWrapper = /^\s*\n|\n\s*$/g

function fixIndent(text){
  if (text && ~text.indexOf('\n')){
    text = text.replace(matchNewLineWrapper, '')
    var match = matchStartSpace.exec(text)
    var indent = match && match[1].length
    if (indent){
      text = '\n' + text.replace(/(^|\n)(\s+)/g, function(_, start, spaces){
        return start + spaces.slice(indent-2)
      }) + '\n'
    }
  }

  return text
}