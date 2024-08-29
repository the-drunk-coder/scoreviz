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

To build, run `npm install && cd web && npm install` in this folder.

Now, in the root folder, you can start the app using `node scoreviz.js` and see the result in the
browser (`localhost:8082`).

The application listens on port `57123` for OSC messages.

## OSC Interface

Format: `address` - `osc typestring` - meaning

* `/voice/note/add` - `sss` - Add note (arg1 - note) with duration (arg2 - note duration) to voice (arg0 - voice id). For note format, check vexflow documentation. 
* `/voice/pos` - 
* `/voice/bgcolor` - `ss` - Set background color (arg1 - color in hex format) of voice (arg0 - voice id).
* `/voice/label` - `ss` - Add a label (arg1 - label string) to voice (arg0 - voice id).
* `/voice/dyn` - `ss` - Add a dynamic symbol (arg1 - dynamic, i.e. *p* or *pp*) to voice (arg0 - voice id).
* `/voice/clef` - `ss` - Add a clef symbol (arg1 - dynamic, i.e. *treble*) to voice (arg0 - voice id).
* `/voice/pad` - `ss` - Pad mode (arg1 - "true" or "false" as string) for voice (arg0 - voice id), pads the last bar with rest for easier playability.
* `/voice/numnotes` - `sf` - Number of notes (arg1) to be displayed in voice (arg0 - voice id). Notes are treated like a queue, if there's more than the specified number, the ones in the beginning will be dropped.
* `/voice/timesignature` - `sff` - Timesignature upper (arg1) and lower (arg2) for voice (arg0 - voice id).
* `/voice/markcurrent` - tbd
* `/textfield/put` - `ssff` - Put a textfield on the score. arg0 - textbox id, arg1 - content, arg2 - x pos, arg3 - y pos.
* `/image/put` - `ssff` - Put an image on the score. arg0 - image id, arg1 - image link, arg2 - x pos, arg3 - y pos.
* `/clear` - `(none)` - clear the entire score

