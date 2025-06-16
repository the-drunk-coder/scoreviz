# scoreviz

A simple, browser-based dynamic (music) score creator for live scoring over OSC.

It allows you to arrange snippets of sheet music, text, and images in a single score that 
can be created and manipulated in most aspects over OSC commands, and thus, can be live coded 
(or generated otherwise) from any language or program that supports sending OSC.

The scores can serve to arrange music, dance, or any kind of action that can be communicated
over text, images or notes.

It's still very much work-in-progress. 

## Requirements 

You need `node.js` and `npm` installed on your system to run this (and a browser, of course).

For OS-independent instructions, see: https://nodejs.org/en/download

On Linux, you can also use your distribution's package manager. 

The version of `node` and `npm` doesn't really matter, any half-recent version will do.

## Build 

Download this repository (or use `git clone` from the command line) and place it in a convenient location.

To build, navigate to the base folder (the folder that contains `scoreviz.js`) and run `npm install`. 

Then, go to the `web` subfolder (`cd web`) and run `npm install` again.

You can also use a single shorthand command from the base folder: `npm i && cd web && npm i`.

## Run

Now, in the base folder, you can start the app using `node scoreviz.js`.

Open a browser and go to `http://localhost:8082`.

The application listens on port `57123` for OSC messages.

## OSC Interface

Format: `address` - `osc typestring` - meaning - arguments

* `/voice/note/add` - `ssss` - Add note. For note pitch format, check vexflow documentation. 
  * argument 0 - voice id
  * argument 1 - note pitch
  * argument 2 - note duration
  * argument 3 - note articulation ("marcato", "tenuto" or "staccato")
* `/voice/pos` - `ff` - set the position of a voice
  * argument 0 - `x` position
  * argument 1 - `position`
* `/voice/bgcolor` - `ss` - Set background color 
  * argument 0 - voice id.
  * argument 1 - color in hex format
* `/voice/label` - `ss` - Add a label to voice 
  * argument 0 - voice id
  * argument 1 - label
* `/voice/dyn` - `ss` - Add a dynamic symbol to voice 
  * argument 0 - voice id
  * argument 1 - dynamic symbol, i.e. *p* or *pp*
* `/voice/clef` - `ss` - Add a clef to voice
  * argument 0 - voice id
  * argument 1 - clef, *treble*, *alto* or *bass*
* `/voice/pad` - `ss` - Pad mode for voice. Pads the last bar with rest for easier playability.
  * argument 0 - voice id
  * argument 1 - "true" or "false" as string
* `/voice/numnotes` - `sf` - Number of notes to be displayed in voice. Notes are treated like a queue, if there are more than the specified number, the ones in the beginning will be dropped.
  * argument 0 - voice id
  * argument 1 - number of notes
* `/voice/repeatmarks` - `sf` - Add repeat marks to specified number of bars
  * argument 0 - voice id
  * argument 1 - number of bars to enclose in repeat marks
* `/voice/timesignature` - `sff` - Timesignature for voice.
  * argument 0 - voice id
  * argument 1 - upper 
  * argument 2 - lower
* `/textfield/put` - `ssfffssf` - Put a textfield on the score. 
  * argument 0 - textfield id
  * argument 1 - content string 
  * argument 2 - x pos 
  * argument 3 - y pos
  * argument 4 - font size
  * argument 5 - font color (hex string without `#` prefix)
  * argument 6 - flash (fade in) - "true" or "false" as string
  * argument 7 - flash time (seconds)
* `/image/put` - `ssfff` - Put an image on the score. 
  * argument 0 - image id, 
  * argument 1 - image link
  * argument 2 - x pos
  * argument 3 - y pos
  * argument 4 - scale factor
* `/clear` - `(none)` - clear the entire score

