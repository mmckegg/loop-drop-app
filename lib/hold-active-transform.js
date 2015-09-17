module.exports = function holdActive (input, active) {
  active.forEach(function(index){
    input.data[index] = {
      events: [],
      held: true,
      length: length
    }
  })
  return input
}