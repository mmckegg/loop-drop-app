var WindowStream = require('window-stream')
var Through = require('through')

var engineWindow = document.getElementById('engineFrame').contentWindow
var engineStream = WindowStream(engineWindow, '/engine.html')


var noteStreamA = Plex(engineStream, 'playback[a]')
var noteStreamB = Plex(engineStream, 'playback[b]')

var clock = Plex(engineStream, 'clock')

var changeStreamA = Plex(engineStream, 'soundbank[a]')

changeStreamA.on('data', function(data){
  console.log(data)
})

var builtIn = [ { id: 0,
    gain: 1.8000000000000007,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 2.2481561136245727,
       offsetEnd: 5.672228835225106,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 1,
    gain: 1.7000000000000006,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 3.0993996906280517,
       offsetEnd: 4.861910430192948,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 2,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 3.9069897508621216,
       offsetEnd: 3.983383405208588,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 3,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 4.736406569480896,
       offsetEnd: 3.164879965782166,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 4,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 5.576736767292023,
       offsetEnd: 2.3245497679710385,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 5,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 6.41706696510315,
       offsetEnd: 1.5169597077369688,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 6,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 7.060956337451935,
       offsetEnd: 0.8103184050321579,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 7,
    gain: 1,
    chokeGroup: 1,
    source:
     { type: 'sample',
       mode: 'oneshot',
       transpose: 0,
       offsetStart: 8.021333706378936,
       offsetEnd: 0,
       url: 'filesystem:http://localhost:9966/persistent/1375492727938.wav' } },
  { id: 8,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.0203428462147714,
       offsetEnd: 0.8891428476199508,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 9,
    gain: 4.200000000000001,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.0613333219662309,
       offsetEnd: 0.8481523718684911,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 13,
    gain: 1.3000000000000003,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.2252952249720694,
       offsetEnd: 0.6841904688626528,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 14,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.143466654419899,
       offsetEnd: 0.7655618965625762,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 15,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.3072761764749887,
       offsetEnd: 0.6022095173597335,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: '16',
    gain: 1,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.283236309289932,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 17,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 1,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.1415945851802825,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 18,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 2,
       offsetStart: 0.0424925172328949,
       offsetEnd: 5.198251274824142,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 19,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 3,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.0991020679473875,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 20,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 4,
       offsetStart: 0.03541043102741242,
       offsetEnd: 5.1345124989748,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 21,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 5,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.403631774783134,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 22,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 6,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.403631774783134,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: 23,
    gain: 1,
    source:
     { type: 'sample',
       transpose: 7,
       offsetStart: 0.049574603438377385,
       offsetEnd: 5.403631774783134,
       url: 'filesystem:http://localhost:9966/persistent/1375493816556.wav' } },
  { id: '24',
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 0,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 25,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 1,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 26,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 2,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 27,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 3,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 28,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 4,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 29,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 5,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 30,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 6,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: 31,
    gain: 20.3,
    source:
     { type: 'sample',
       transpose: 7,
       offsetStart: 1.1433142734691502,
       offsetEnd: 0.8045714199542999,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } },
  { id: '32',
    gain: 1,
    source:
     { type: 'sample',
       transpose: 4,
       offsetStart: 1.1843047492206098,
       offsetEnd: 0.7251809446141123,
       url: 'filesystem:http://localhost:9966/persistent/1375491546166.wav' } } ]

setTimeout(function(){

  builtIn.forEach(function(sound){
    changeStream.write(sound)
  })

  for (var i=31;i<64;i++){
    changeStreamA.write({
      id: i, source: {type: 'oscillator', pitch: 34+i, shape: 2}, gain: 0.5
    })
  }


}, 200)





window.changeStream = changeStreamA



function Plex(stream, channel){
  var result = Through(function(data){
    stream.write(JSON.stringify({channel: result.channel, data: data}))
  })
  result.channel = channel
  stream.on('data', function(data){
    var object = null

    try {
      object = JSON.parse(data)
    } catch (ex){}

    if (object && object.channel == result.channel){
      result.queue(object.data)
    }
  })
  return result
}
