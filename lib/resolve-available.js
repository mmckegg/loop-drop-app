module.exports = resolveAvailable

function resolveAvailable (lookup, key, lastKey) {
  var base = key
  var incr = 1

  var numberMatch = /(.+) ([0-9]+)$/.exec(key)
  if (numberMatch) {
    base = numberMatch[1]
    incr = parseInt(numberMatch[2], 10)
  }

  var existing = (Array.isArray(lookup) ? lookup : Object.keys(lookup)).map(x => x.toLowerCase())

  while (existing.includes(key.toLowerCase()) && key.toLowerCase() !== (lastKey ? lastKey.toLowerCase() : null)) {
    incr += 1
    key = base + ' ' + incr
  }

  return key
}
