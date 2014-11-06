module.exports = function decibelsToGain(value){
  if (value <= -40){
    return 0
  }
  return Math.round(Math.exp(value / 8.6858) * 10000) / 10000
}