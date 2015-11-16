window.addEventListener('load', function() {
  navigator.requestMIDIAccess().then(
    onMIDIInit,
    onMIDISystemError
  );
});

function onMIDISystemError(err) {
  console.log("MIDI puked!", err);
}

// To get newly plugged controllers
// midiAccess.onstatechange = function midiConnectionStateChange( e ) {
//   populateMIDIInSelect();
// };

// Just listen to everything and call midiMessageReceived
function onMIDIInit(midi) {
  window.midi = midi; // for debugging purposes
  initPush(midi);
  for (var input of midi.inputs.values()) {
    input.onmidimessage = midiMessageReceived;
  }
}

// function onMIDIInit( midi ) {
//   for (var input of midi.outputs.values())
//     input.send( [0x90, 3, 32] );
// }

// Parse MIDI input
function midiMessageReceived(ev) {

  var cmd = ev.data[0] >> 4;
  var channel = ev.data[0] & 0xf;
  var noteNumber = ev.data[1];
  var velocity = 0;

  console.log(ev);

  if (ev.data.length > 2) velocity = ev.data[2];

  // MIDI noteon with velocity=0 is the same as noteoff
  if ( cmd == 8 || ((cmd == 9) && (velocity == 0)) ) { // noteoff
    noteOff(noteNumber);
  }
  else if (cmd == 9) { // note on
    noteOn(noteNumber, velocity);
  }
  else if (cmd == 11) { // controller message
    controller(noteNumber, velocity);
  }
  else if (cmd == 10) { // aftertouch
    afterTouch(noteNumber, velocity);
  }
  else {
    // probably sysex!
    console.log("Unknown: cmd:", cmd, "ev.data:", ev.data);
  }
}

// Handle noteOn
function noteOn(noteNumber, velocity) {
  console.log("Note on:", noteNumber, velocity);
}

// Handle noteOff
function noteOff(noteNumber) {
  console.log("Note off:", noteNumber);
}

// Handle cc
function controller(control, value) {
  console.log("CC:", control, value);
}

// Handle aftertouch
function afterTouch(note, pressure) {
  console.log("Aftertouch:", note, pressure);
}

// Send constants
// Add 0x0? for channel, from 0 to F (16)
CMD = {
  noteOff: 0x80,
  noteOn: 0x90,
  afterTouch: 0xA0,
  cc: 0xB0,
  programChange: 0xC0,
  channelPressure: 0xD0,
  pitchWheel: 0xE0
}

// Push constants
// Channel for pads makes colours behave differently
// Sum these values to the noteOn command above
// e.g: 0x90 - noteOn on channel 1
//      0x9F - noteOn on channel 16
padModes = {
  normal: 0x00,
  fadeInFast: 0x03,
  fadeInMed: 0x04,
  fadeInSlow: 0x05,
  flashTripletBeats: 0x06,
  cycleColorsFast: 0x07,
  pulseQuarterBeats: 0x08,
  pulseWholeBeats: 0x09,
  pulseTwoBeats: 0x0A,
  flashInverseTripletBeats: 0x0B,
  flashInverseEightBeats: 0x0C,
  flashInverseQuarterBeats: 0x0D,
  flashInverseWholeBeats: 0x0E,
  flashInverseTwoBeats: 0x0F
}

// More Push constants, this time for non-pad buttons
// Send these CC values for the desired results
ccButtonModes = {
  off: 0,
  red_dim: 1,
  red_dim_flash_half_beat: 2,
  red_dim_flash_beat: 3,
  red: 4,
  red_flash_half_beat: 5,
  red_flash_beat: 6,
  orange_dim: 7,
  orange_dim_flash_half_beat: 8,
  orange_dim_flash_beat: 9,
  orange: 10,
  orange_flash_half_beat: 11,
  orange_flash_beat: 12,
  yellow_dim: 13,
  yellow_dim_flash_half_beat: 14,
  yellow_dim_flash_beat: 15,
  yellow: 16,
  yellow_flash_half_beat: 17,
  yellow_flash_beat: 18,
  green_dim: 19,
  green_dim_flash_half_beat: 20,
  green_dim_flash_beat: 21,
  green: 22,
  green_flash_half_beat: 23,
  green_flash_beat: 24,
}

padColors = {

}

// Utiliy functions

// Iterator target
function consoleit(item) {
  console.log(item);
}

// Pass midi.inputs or midi.outputs as second parameter to be more specific
function getDevicesByName(name, deviceIterator) {
  var name = name.toLowerCase(),
      devices = [],
      inputs, outputs;

  if (deviceIterator.inputs && deviceIterator.outputs) {
    inputs = deviceIterator.inputs;
    outputs = deviceIterator.outputs;
  }
  else {
    if (deviceIterator.constructor.name == 'MIDIInputMap') inputs = deviceIterator;
    if (deviceIterator.constructor.name == 'MIDIOutputMap') outputs = deviceIterator;
  }

  if (inputs) {
    inputs.forEach(function(device) {
      if (device.name.toLowerCase().includes(name)) devices.push(device);
    });
  }
  if (outputs) {
    outputs.forEach(function(device) {
      if (device.name.toLowerCase().includes(name)) devices.push(device);
    });
  }

  return devices;
}


// Init push input and output
// Debug code, fucking ugly
function initPush(midi) {
  window.input = getDevicesByName('push user', midi.inputs)[0];
  window.output = getDevicesByName('push user', midi.outputs)[0];
}
