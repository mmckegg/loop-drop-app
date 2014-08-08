var Through = require('through')
module.exports = function(){
  return Through(function(data){
    if (data.event === 'start'){
      this.queue([144, parseInt(data.id), data.args[0] || 127, data.position])
    } else if (data.event === 'stop'){
      this.queue([144, parseInt(data.id), 0, data.position])
    }
  })
}