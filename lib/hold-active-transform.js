module.exports = function holdActive (input, active) {
  active.forEach(function(index){
    input.data[index] = {
      events: [[0, true]],
      length: 2
    }
  })
  return input
}
