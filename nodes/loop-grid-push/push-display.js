function PushDisplay(duplexPort) {

  // We need a MIDI duplexPort, or else nothing happens!
  if (!duplexPort) {
    console.error("PushDisplay: invalid MIDI output");
    return null;
  }
  this.duplexPort = duplexPort;


  /*
   Instance methods:

   They should all return `this` to allow chaining, as in:
   display.setCell(0, 0, "OHAI").setCell(0, 1, "THERE").update();
  */

  // init()
  //
  // Initialize display state
  this.init = function() {
    this.clear().update();
    return this;
  }

  // clear()
  //
  // Reset display state
  this.clear = function() {
    // This stores the curent display state. For all intents
    // and purposes we'll use it as a 4 row containing 8 columns
    // of 8 characters. This ensures displayed data lines up with
    // pads, buttons and knobs.
    var EMPTY = '        '; // 8 spaces
    this.cells = [
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
    ];
    return this;
  }

  // setCell(Number row, Number col, String string)
  //
  // Self-explanatory, except for the fact it DOESN'T update
  // the display right away.
  this.setCell = function(row, col, string) {
    // Each column must have exactly 8 chars
    if (string.length < 8) string += ' '.repeat(8 - string.length);
    string = string.substr(0, 8);

    this.cells[row][col] = string;
    return this;
  }


  // update([Array rows]])
  //
  // Updates the display with the content of `this.cells`.
  // Uses `rows` when provided.
  this.update = function(rows) {
    var sysExOut = [
      [0xF0, 0x47, 0x7F, 0x15, 0x18, 0x00, 0x45, 0x00],
      [0xF0, 0x47, 0x7F, 0x15, 0x19, 0x00, 0x45, 0x00],
      [0xF0, 0x47, 0x7F, 0x15, 0x1A, 0x00, 0x45, 0x00],
      [0xF0, 0x47, 0x7F, 0x15, 0x1B, 0x00, 0x45, 0x00]
    ];
    var TERMINATOR = 0xF7;

    // Build display rows, unless provided.
    if (!rows) {
      var rows = [];
      for (var row = 0; row < 4; row++) {
        var row_data = '';
        for (var col = 0; col < this.cells[row].length; col += 2) { // Note the increment
          row_data += this.cells[row][col] + ' ' + this.cells[row][col + 1];
        }
        rows.push(row_data);
      }
    }

    // We need exactly 4 rows.
    if (rows.length !== 4) {
      console.error("PushDisplay.update: you must provide exactly 4 rows");
      return null;
    }

    for (var row = 0; row < 4; row++) {
      for (var ch = 0; ch < rows[row].length; ch++) {
        sysExOut[row].push(rows[row].charCodeAt(ch));
      }
      sysExOut[row].push(TERMINATOR);
      this.duplexPort.write(sysExOut[row]);
    }

    return this;
  }

  // First init
  this.init();
}

module.exports = PushDisplay;
