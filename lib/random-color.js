module.exports = randomColor
function randomColor(mix){
  var red = Math.random()*256
  var green = Math.random()*256
  var blue = Math.random()*256
  if (mix != null) {
    red = (red + mix[0]) / 2
    green = (green + mix[1]) / 2
    blue = (blue + mix[2]) / 2
  }
  return [Math.floor(red),Math.floor(green),Math.floor(blue)]
}