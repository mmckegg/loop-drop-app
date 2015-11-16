loop-launchpad
===

Novation Launchpad bindings for [loop-grid](https://github.com/mmckegg/loop-grid).

## Controller Mapping

Trigger sounds using the **main grid** on the Launchpad hardware that corresponds to the interface grid that you have added chunks to.

### Beat Repeat

The side buttons (A-H) on the Launchpad enable **beat repeat** mode as follows:
  
  - None (free play), 
  - 1
  - 2/3
  - 1/2
  - 1/3
  - 1/4
  - 1/6
  - 1/8

When beat repeat is enabled, **hold down** a trigger on the main grid, and it will be **continuously triggered** at the selected rate to the project tempo specified. This allows you to play in perfect time with the tempo.

### Store Loop

By default the last 2 bars of everything you play is being recorded. The top buttons (1-8) control the current loop. Press **1**/**learn** to start looping the events you just played.

### Clear / Flatten

When no transformations are currently active (no beat repeat held or active suppression), **2**/**view** clears the currently playing loop, otherwise it locks in the current transform.

### Undo / Redo

Top buttons **3** and **4** (the page buttons) trigger undo or redo of stored loop on press.

### Beat Hold

Top button **5**/**inst** will loop the currently playing beat at the rate specified by the Beat Repeat buttons (A-H) when held down. You can lock in the loop by pressing the Flatten button (2/view) at the same time.

### Suppress

Top button **6**/**fx** will suppress all current playback when held down. You can lock that in by pressing the Flatten button (2/view) at the same time.

### Select / Move

To select buttons, hold down top button **8**/**mixer**, and press some buttons on the grid and release. You can now hold **Suppress** to mute the selected slots, or hold another button on the grid to move/offset the loop events. 

### Loop Length

Hold `select` (8/mixer) and press the `undo` (3/prevpage) button to halve loop length or `redo` (4/nextpage) to double.