loop-grid-launchpad-mk2
===

Novation Launchpad bindings for [loop-grid](https://github.com/mmckegg/loop-grid). Supports MK2 and Pro (maybe?)

## Controller Mapping

Trigger sounds using the **main grid** on the Launchpad hardware that corresponds to the interface grid that you have added chunks to.

### Beat Repeat

The side buttons on the Launchpad enable **beat repeat** mode as follows:

  - None (free play),
  - 1
  - 2/3
  - 1/2
  - 1/3
  - 1/4
  - 1/6
  - 1/8

When beat repeat is enabled, **hold down** a trigger on the main grid, and it will be **continuously triggered** at the selected rate to the project tempo specified. This allows you to play in perfect time with the tempo.

If `Select / Move` is held whilst selecting repeat rate, the **off-beat** will be repeated instead.

### Store Loop

By default the last 2 bars of everything you play is being recorded. The top buttons (1-8) control the current loop. Press `🔼` to start looping the events you just played.

### Clear / Flatten

When no transformations are currently active (no beat repeat held or active suppression), `🔽` clears the currently playing loop, otherwise it locks in the current transform.

### Undo / Redo

Top buttons `◀` and `▶` trigger undo or redo of stored loop on press.

### Beat Hold

Top button <key>Session</key> will loop the currently playing beat at the rate specified by the Beat Repeat buttons (right side) when held down. You can lock in the loop by pressing the Flatten button (`🔽`) at the same time.

### Suppress

Top button `User 1` will suppress all current playback when held down. You can lock that in by pressing the Flatten button (`🔽`) at the same time.

### Select / Move

To select buttons, hold down top button `Mixer`, and press some buttons on the grid and release. You can now hold **Suppress** (`User 1`) to mute the selected slots, or hold another button on the grid to move/offset the loop events.

### Loop Length

Hold `select` (`Mixer`) and press the `undo` (`◀`) button to halve loop length or `redo` (`▶`) to double.
