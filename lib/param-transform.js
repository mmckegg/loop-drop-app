var computed = require('@mmckegg/mutant/computed')
var Value = require('@mmckegg/mutant/value')
var MutantArray = require('@mmckegg/mutant/array')
var isObservable = require('@mmckegg/mutant/is-observable')
var ParamSource = require('lib/param-source')

module.exports = ParamTransform

var count = 0

function ParamTransform (inputs, reduceParams, reduceValues) {
  var context = {
    reduceParams: reduceParams,
    reduceValues: reduceValues,
    id: count++
  }

  if (isObservable(inputs)) {
    return computed([inputs], lambda, {
      context: context,
      comparer: deepEqualNoArray // otherwise mutant maps get removed
    })
  } else {
    return computed(inputs.map(getCurrentValue), lambdaWithRest, {
      context: context,
      comparer: deepEqual
    })
  }
}

ParamTransform.deepEqual = deepEqual

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
      this.nodes = MutantArray(nodes, { comparer: deepEqual, fixedIndexing: true })
      this.result = this.reduceParams(nodes[0].context, this.nodes, this.numberResult)
    } else {
      this.numberResult.set(numberResult)
      this.nodes.set(nodes)
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
  if (a instanceof global.AudioNode && a === b) {
    return true
  } else if (Array.isArray(a) && Array.isArray(b)) {
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
