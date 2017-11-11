var computed = require('mutant/computed')
var Value = require('mutant/value')
var isObservable = require('mutant/is-observable')
var ParamSource = require('lib/param-source')
var resolve = require('mutant/resolve')
var getParamValue = require('lib/get-param-value')

module.exports = ParamTransform

var count = 0

function ParamTransform (inputs, reduceParams, reduceValues) {
  var context = {
    reduceParams: reduceParams,
    reduceValues: reduceValues,
    id: count++
  }

  var result = null
  if (isObservable(inputs)) {
    result = computed([inputs], lambda, {
      context: context,
      comparer: deepEqualNoArray // otherwise mutant maps get removed
    })
  } else {
    result = computed(inputs.map(getCurrentValue), lambdaWithRest, {
      context: context,
      comparer: deepEqual
    })
  }
  result.getValueAtTime = getValueAtTime.bind(context, result)
  return result
}

ParamTransform.deepEqual = deepEqual

function getValueAtTime (source, at) {
  var value = resolve(source)
  if (typeof value === 'number') {
    return value
  } else if (value && value.getValueAtTime) {
    return value.getValueAtTime(at)
  }
}

function getCurrentValue (value) {
  return value.currentValue || value
}

function lambdaWithRest (...inputs) {
  return lambda.call(this, inputs)
}

function lambda (inputs) {
  var nodes = inputs.filter(isAudioNode)
  var numbers = inputs.filter(isNumber)
  var params = inputs.filter(ParamSource.isParam)
  var numberResult = getNumberResult(numbers, params, this.reduceValues)
  if (nodes.length > 0) {
    if (!this.numberResult) {
      this.numberResult = Value(numberResult)
      this.nodes = Value(nodes)
      this.result = this.reduceParams(nodes[0].context, this.nodes, this.numberResult)
    } else {
      if (!deepEqual(this.nodes(), nodes)) {
        this.nodes.set(nodes)
      }
      this.numberResult.set(numberResult)
    }
    return this.result
  } else {
    if (this.numberResult) {
      // clear out existing
      this.numberResult.set(numberResult)
      this.nodes.set(nodes)
    }
    return numberResult
  }
}

function isAudioNode (value) {
  return value instanceof global.AudioNode
}

function isNumber (value) {
  return typeof value === 'number'
}

function deepEqualNoArray (a, b) {
  if (Array.isArray(a) && a === b) {
    return false
  } else {
    return deepEqual(a, b)
  }
}

function deepEqual (a, b) {
  if ((a instanceof global.AudioNode || typeof a === 'number' || typeof a === 'string') && a === b) {
    return true
  } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

function getNumberResult (numbers, params, reducer) {
  if (params.length) {
    return ParamSource.reduce(params.concat(numbers), reducer)
  } else {
    return reducer(numbers)
  }
}
