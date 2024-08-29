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

* `/voice/note/add`
* `/voice/pos`
* `/voice/bgcolor`
* `/voice/label`
* `/voice/dyn`
* `/voice/clef`
* `/voice/pad`
* `/voice/numnotes` 
* `/voice/timesignature`
* `/voice/markcurrent`
* `/textfield/put`
* `/image/put` 
* `/clear` 

