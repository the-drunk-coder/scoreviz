// get vexflow API
//const VF = Vex.Flow;
const { Formatter, Renderer, Stave, StaveNote, StaveTie, TextNote, Dot, Voice, Accidental } = Vex.Flow;

var staves = {};
var textfields = {};
var images = {};

// desired functions:

// - score name
// - group staves, 
// - "snippet mode" bs "rt mode (change always, mark current)"

// - [x] cute additions (emojis for playing style ?) (text labels can be cute)
// - [x] text snippets in random positions
// - [x] transpose notes according to clef (vexflow does it after all)
// - [x] put a color background
// - [x] position staves
// - [x] name staves
// - [x] stave history, between 1 and 4 notes?
// - [x] dynamic mark on stave
// - [x] clef for stave
// - [x] color "active" note

function dotted(staveNote, noteIndex = -1) {
    if (noteIndex < 0) {
	Dot.buildAndAttach([staveNote], {
	    all: true
	});
    } else {
	Dot.buildAndAttach([staveNote], {
	    index: noteIndex
	});
    }
    return staveNote;
}

// straight
let T_1 = 16384;
let T_2 = T_1 / 2;
let T_4 = T_2 / 2;
let T_8 = T_4 / 2;
let T_16 = T_8 / 2;
let T_32 = T_16 / 2;
let T_64 = T_32 / 2;
let T_128 = T_64 / 2;

// dotted
let T_D_2 = T_2 + T_4;
let T_D_4 = T_4 + T_8;
let T_D_8 = T_8 + T_16;
let T_D_16 = T_16 + T_32;
let T_D_32 = T_32 + T_64;
let T_D_64 = T_64 + T_128;

// double_dotted
let T_DD_2 = T_2 + T_4 + T_8;
let T_DD_4 = T_4 + T_8 + T_16;
let T_DD_8 = T_8 + T_16 + T_32;
let T_DD_16 = T_16 + T_32 + T_64;
let T_DD_32 = T_32 + T_64 + T_128;

// triple_dotted
let T_DDD_2 = T_2 + T_4 + T_8 + T_16;
let T_DDD_4 = T_4 + T_8 + T_16 + T_32;
let T_DDD_8 = T_8 + T_16 + T_32 + T_64;
let T_DDD_16 = T_16 + T_32 + T_64 + T_128;

// brute-force 
// assume for notes < T_1
function ticks_to_sym(ticks) {
    let syms = [];
    while (ticks > 0) {
	// smallest possible note, currently 
	if (ticks < T_128) {
	    return syms;
	}

	if (ticks == T_1) {
	    return [["w", 0]];
	} else if (ticks >= T_DDD_2) { // half
	    syms.push(["h", 3]);
	    ticks -= T_DDD_2;
	} else if (ticks >= T_DD_2) {
	    syms.push(["h", 2]);
	    ticks -= T_DD_2;
	} else if (ticks >= T_D_2) {
	    syms.push(["h", 1]);
	    ticks -= T_D_2;
	} else if (ticks >= T_2) {
	    syms.push(["h", 0]);
	    ticks -= T_2;
	} else if (ticks >= T_DDD_4) { // quarter
	    syms.push(["4", 3]);
	    ticks -= T_DDD_4;
	} else if (ticks >= T_DD_4) {
	    syms.push(["4", 2]);
	    ticks -= T_DD_4;
	} else if (ticks >= T_D_4) {
	    syms.push(["4", 1]);
	    ticks -= T_D_4;
	} else if (ticks >= T_4) {
	    syms.push(["4", 0]);
	    ticks -= T_4;
	} else if (ticks >= T_DDD_8) { // eighth
	    syms.push(["8", 3]);
	    ticks -= T_DDD_8;
	} else if (ticks >= T_DD_8) {
	    syms.push(["8", 2]);
	    ticks -= T_DD_8;
	} else if (ticks >= T_D_8) {
	    syms.push(["8", 1]);
	    ticks -= T_D_8;
	} else if (ticks >= T_8) {
	    syms.push(["8", 0]);
	    ticks -= T_8;
	} else if (ticks >= T_DDD_16) { // sixteenth
	    syms.push(["16", 3]);
	    ticks -= T_DDD_16;
	} else if (ticks >= T_DD_16) {
	    syms.push(["16", 2]);
	    ticks -= T_DD_16;
	} else if (ticks >= T_D_16) {
	    syms.push(["16", 1]);
	    ticks -= T_D_16;
	} else if (ticks >= T_16) {
	    syms.push(["16", 0]);
	    ticks -= T_16;
	}  else if (ticks >= T_DD_32) { // thirtysecond
	    syms.push(["32", 2]);
	    ticks -= T_DD_32;
	} else if (ticks >= T_D_32) {
	    syms.push(["32", 1]);
	    ticks -= T_D_32;
	} else if (ticks >= T_32) {
	    syms.push(["32", 0]);
	    ticks -= T_32;
	} else if (ticks >= T_D_64) { // sixtyfourth
	    syms.push(["64", 1]);
	    ticks -= T_D_64;
	} else if (ticks >= T_64) {
	    syms.push(["64", 0]);
	    ticks -= T_64;
	} else if (ticks >= T_128) { // 128
	    syms.push(["128", 0]);
	    ticks -= T_128;
	}
	
    }
    return syms;
}

// convert list of notes to list of measures, to be able
// to draw one stave per measure (vexflow requirement)
// (PROBABLY) INCOMPLETE
function notes_to_measures(notes, upper, lower, pad) {
    let inner_notes = notes.slice();

    let measures = [];
    let measure = [];
    let ties = [];

    let ticks_to_fill_per_bar = upper * (16384 / lower);
    let full_bar = upper * (16384 / lower);

    let num_notes = inner_notes.length;

    for (var i = 0; i < num_notes; i++) {
	
	let note = inner_notes.shift();
	
	if (note.intrinsicTicks <= ticks_to_fill_per_bar) {
	    // note fits into bar
	    measure.push(note);
	    ticks_to_fill_per_bar -= note.intrinsicTicks
	} else {
	    // note doesn't fit into bar
	    
	    // bar is not full yet, note needs to be
	    // split and tied ...
	    if (ticks_to_fill_per_bar > 0) {

		// length of each note in ticks
		let len_a = ticks_to_fill_per_bar;
		let len_b = note.intrinsicTicks - ticks_to_fill_per_bar;

		// calculate the symbols
		let sym_a = ticks_to_sym(len_a);
		let sym_b = ticks_to_sym(len_b);

		// calculate the split & tied notes
		let tied_notes = []; 

		// ticks_to_sym might return multiple notes, even
		// though it's very unlikely (but might change in the future)
		for (const [num, rest] of Object.entries(sym_a)) {
		    
		    var sym_a_note;

		    if (rest[1] >>> 0) { // dotted note
			let ds = "";
			for (var d = 0; d < rest[1]; d++){
			    ds += "d";
			}			
			sym_a_note = new StaveNote({ keys: note.keys, duration: rest[0] + ds});
			for (var d = 0; d < rest[1]; d++) {
			    dotted(sym_a_note);
			}	    		
		    } else { // plain note
			sym_a_note = new StaveNote({ keys: note.keys, duration: rest[0]});	    
		    }

		    tied_notes.push(sym_a_note);		    		    		    
		}

		// keep for later
		let sym_a_notes = tied_notes.length;

		// ticks_to_sym might return multiple notes, even
		// though it's very unlikely (but might change in the future)
		for (const [num, rest] of Object.entries(sym_b)) {
		    
		    var sym_b_note;

		    if (rest[1] >>> 0) { // dotted notes, we have to draw dots
			let ds = "";
			for (var d = 0; d < rest[1]; d++){
			    ds += "d";
			}

			sym_b_note = new StaveNote({ keys: note.keys, duration: rest[0] + ds});

			// add dot to note 
			for (var d = 0; d < rest[1]; d++) {
			    dotted(sym_b_note);
			}	    	
		    } else {
			sym_b_note = new StaveNote({ keys: note.keys, duration: rest[0] });	    
		    }

		    tied_notes.push(sym_b_note);		   
		}

		// create ties, to be drawn later
		for (var j = 0; j < tied_notes.length - 1; j++) {
		    ties.push(new StaveTie({
			first_note: tied_notes[j],
			last_note: tied_notes[j+1],
			first_indices: [0],
			last_indices: [0],
		    }));		    
		}

		// add what's split off and remains in first measure
		for (var j = 0; j < sym_a_notes; j++) {
		    measure.push(tied_notes[j]);
		}

		// push full measure
		measures.push(measure);

		// start new measure
		measure = [];

		// add what's split off and starts the second measure
		for (var j = sym_a_notes; j < tied_notes.length; j++) {
		    measure.push(tied_notes[j]);
		}

		// calc what's left to fill
		ticks_to_fill_per_bar = upper * (16384 / lower) - len_b;
		
	    } else {
		// bar is full, start new bar 
		measures.push(measure);
		measure = [];
		ticks_to_fill_per_bar = upper * (16384 / lower);
		// add note 
		measure.push(note);
		ticks_to_fill_per_bar -= note.intrinsicTicks
	    }	   	    	    
	}
    }

    // fill bar with rest
    if (pad === true && ticks_to_fill_per_bar > 0) {
	let rests = ticks_to_sym(ticks_to_fill_per_bar);

	for (const [num, rest] of Object.entries(rests)) {
	    
	    var rest_note;
	    if (rest[1] >>> 0) { // dotted

		let ds = "";
		for (var d = 0; d < rest[1]; d++){
		    ds += "d";
		}
		rest_note = new StaveNote({ keys: ["b/4"], duration: rest[0] + ds + "r"});

		for (var d = 0; d < rest[1]; d++) {
		    dotted(rest_note);
		}
	    	
	    } else { // plain
		rest_note = new StaveNote({ keys: ["b/4"], duration: rest[0] + "r"});	    
	    }

	    measure.push(rest_note);
	}
    }

    // last measure
    measures.push(measure);

    let last_signature = [upper, lower];

    if (pad === false && ticks_to_fill_per_bar > 0) {
	if (ticks_to_fill_per_bar % T_1 === 0) {
	    last_signature = [full_bar / T_1 - ticks_to_fill_per_bar / T_1, 1];
	} else if (ticks_to_fill_per_bar % T_2 === 0) {
	    last_signature = [full_bar / T_2 - ticks_to_fill_per_bar / T_2, 2];
	} else if (ticks_to_fill_per_bar % T_4 === 0) {
	    last_signature = [full_bar / T_4 - ticks_to_fill_per_bar / T_4, 4];
	} else if (ticks_to_fill_per_bar % T_8 === 0) {
	    last_signature = [full_bar / T_8 - ticks_to_fill_per_bar / T_8, 8];
	} else if (ticks_to_fill_per_bar % T_16 === 0) {
	    last_signature = [full_bar / T_16 - ticks_to_fill_per_bar / T_16, 16];
	} else if (ticks_to_fill_per_bar % T_32 === 0) {
	    last_signature = [full_bar / T_32 - ticks_to_fill_per_bar / T_32, 32];
	} else if (ticks_to_fill_per_bar % T_64 === 0) {
	    last_signature = [full_bar / T_64 - ticks_to_fill_per_bar / T_64, 64];
	} else if (ticks_to_fill_per_bar % T_128 === 0) {
	    last_signature = [full_bar / T_128 - ticks_to_fill_per_bar / T_128, 128];
	}
    }
             
    return [measures, ties, last_signature];
}

function formatAndDraw(
    ctx,
    stave,
    notes,
    params,
) {

    let options = {
	auto_beam: false,
	align_rests: false,
    };

    if (typeof params === 'object') {
	options = { ...options, ...params };
    } else if (typeof params === 'boolean') {
	options.auto_beam = params;
    }

    var num_beats = 4;
    var beat_value = 4;
    
    if (params.signature !== undefined) {
	num_beats = params.signature[0];
	beat_value = params.signature[1];	
    }
    // Start by creating a voice and adding all the notes to it.
    const voice = new Voice({
	num_beats: num_beats,
	beat_value: beat_value,
	resolution: 16384,
    }).setMode(Voice.Mode.SOFT).addTickables(notes);

    // Then create beams, if requested.
    const beams = options.auto_beam ? Beam.applyAndGetBeams(voice) : [];

    // Instantiate a `Formatter` and format the notes.
    new Formatter()
	.joinVoices([voice]) 
	.formatToStave([voice], stave, { align_rests: options.align_rests, stave });

    // Render the voice and beams to the stave.
    voice.setStave(stave).draw(ctx, stave);
    beams.forEach((beam) => beam.setContext(ctx).draw());

    // Return the bounding box of the voice.
    return voice.getBoundingBox();
}

var div = document.getElementById("boo");

function render() {
    
    // clear score first ... this is not very efficient I suppose, 
    div.innerHTML = '';

    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(1920, 1080);
    
    const context = renderer.getContext();
    context.setFont("mononoki", 10, "");

    // get svg for stuff like background color ...
    let svg = document.getElementsByTagName('svg')[0];
    
    // render staves 
    for (const [name, stave_props] of Object.entries(staves)) {
		
	let [measures, ties, last_signature] = notes_to_measures(
	    stave_props.notes,
	    stave_props.timesignature.upper,
	    stave_props.timesignature.lower,
	    stave_props.pad
	);
	
	// estimate width
	let rect_width = (measures.length * 240) + 110;
	
	// stave background color
	if (stave_props.bgcolor) {
	    var svgns = "http://www.w3.org/2000/svg";
	    var rect = document.createElementNS(svgns, 'rect');
	    rect.setAttributeNS(null, 'x', stave_props.x);
	    rect.setAttributeNS(null, 'y', stave_props.y + 12);
	    rect.setAttributeNS(null, 'height', 90);
	    rect.setAttributeNS(null, 'width', rect_width);
	    rect.setAttributeNS(null, 'fill', '#' + stave_props.bgcolor);
	    svg.appendChild(rect);
	}

	// stave label
	if (stave_props.label) {
	    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	    label.setAttributeNS(null, 'x', stave_props.x + rect_width - 60);
	    label.setAttributeNS(null, 'y', stave_props.y + 70);
	    label.setAttributeNS(null, 'fill', '#000');
	    label.setAttributeNS(null, 'font-size', '30');
	    label.textContent = stave_props.label;
	    svg.appendChild(label);	   
	}
	
	const stave_measure_0 = new Stave(stave_props.x, stave_props.y, 280);
	stave_measure_0
	    .addClef(stave_props.clef)
	    .addTimeSignature(stave_props.timesignature.upper + "/" + stave_props.timesignature.lower)	    
	    .setContext(context)
	    .draw();

	var stave_name = new TextNote({
            text: name,
            font: {
		family: "Mononoki",
		size: 12,
		weight: "bold"
            },
            duration: 'w'               
	})
	    .setLine(2)
	    .setStave(stave_measure_0)
	    .setJustification(TextNote.Justification.LEFT);
	
	var dyn = new TextNote({
            glyph: stave_props.dyn,
            font: {
		family: "Mononoki",
		size: 12,
		weight: "bold"
            },
            duration: 'w'               
	})
	    .setLine(2)
	    .setStave(stave_measure_0)
	    .setJustification(TextNote.Justification.LEFT);
	
	// first bar
	let notes_measure_0 = measures.shift();

	// last bar
	var notes_measure_last = undefined;	
	if (measures.length > 0) {
	    notes_measure_last = measures.pop();
	}

	let signature = [
	    stave_props.timesignature.upper,
	    stave_props.timesignature.lower
	];
		
	// Helper function to justify and draw a 4/4 voice
	formatAndDraw(context, stave_measure_0, notes_measure_0, { signature: signature });
	formatAndDraw(context, stave_measure_0, [dyn, stave_name], { signature: signature });
	
	let width = stave_measure_0.width + stave_measure_0.x;
	
	for (const [n, notes_measure] of Object.entries(measures)) {
	    const stave_measure = new Stave(width, stave_props.y, 240);	   
	    stave_measure.setContext(context).draw();	    	    
	    formatAndDraw(context, stave_measure, notes_measure, { signature: signature });
	    width += stave_measure.width;
	}	

	if (notes_measure_last !== undefined) {
	    const stave_measure = new Stave(width, stave_props.y, 240);	   
	    if (last_signature[0] === signature[0] && last_signature[1] === signature[1]) {
		stave_measure		
		    .setContext(context).draw();	    	    
	    } else {
		stave_measure
		    .addTimeSignature(last_signature[0] + "/" + last_signature[1])	    
		    .setContext(context).draw();	    	    
	    }
	    	    	    
	    formatAndDraw(context, stave_measure, notes_measure_last, { signature: last_signature });
	}

	// draw ties
	ties.forEach((t) => {
	    t.setContext(context).draw();
	});
    }

    // render textfields
    for (const [name, textfield_props] of Object.entries(textfields)) {
	var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	text.setAttributeNS(null, 'x', textfield_props.x);
	text.setAttributeNS(null, 'y', textfield_props.y);
	text.setAttributeNS(null, 'fill', '#000');
	text.textContent = textfield_props.content;
	svg.appendChild(text);
    }

    // images 
    for (const [name, image_props] of Object.entries(images)) {
	var svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
	svgimg.setAttributeNS(null, 'height', image_props.height);
	svgimg.setAttributeNS(null, 'width', image_props.width);
	svgimg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', image_props.ref);
	svgimg.setAttributeNS(null,'x', image_props.x);
	svgimg.setAttributeNS(null,'y', image_props.y);
	svgimg.setAttributeNS(null, 'visibility', 'visible');
	svg.appendChild(svgimg);
    }
}

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8082", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {
    
    switch(msg.address) {

    case "/voice/markcurrent": {
	// whether the current note should be marked
	var stave = msg.args[0].value;
	var mark = msg.args[1].value;

	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}

	staves[stave].markcurrent = Boolean(mark === 'true');
	
	break;
    }
    case "/voice/pad": {
	// whether the voice should be padded to a full bar
	var stave = msg.args[0].value;
	var pad = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].pad = Boolean(pad === 'true');

	console.log("PAD " + staves[stave].pad);
	
	break;
    }	
    case "/voice/pos": {
	var stave = msg.args[0].value;
	var x = msg.args[1].value;
	var y = msg.args[2].value;	

	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].x = x;
	staves[stave].y = y;

	render();
	
	break;
    }
    case "/voice/bgcolor": {
	var stave = msg.args[0].value;
	var col = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].bgcolor = col;

	render();
	
	break;
    }
    case "/voice/label": {
	var stave = msg.args[0].value;
	var label = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].label = label;

	render();
	
	break;
    }
    case "/voice/numnotes": {
	var stave = msg.args[0].value;
	var num_notes = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].num_notes = num_notes;

	render();
	
	break;
    }	
    case "/voice/dyn": {
	var stave = msg.args[0].value;
	var dyn = msg.args[1].value;	

	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].dyn = dyn;

	break;
    }
    case "/voice/clef": {
	var stave = msg.args[0].value;
	var clef = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
			
	staves[stave].clef = clef;

	break;
    }
    case "/voice/timesignature": {
	var stave = msg.args[0].value;
	var upper = msg.args[1].value;
	var lower = msg.args[2].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	if (staves[stave].timesignature === undefined) {
	    staves.timesignature = {};
	}
	
	staves[stave].timesignature.upper = upper;
	staves[stave].timesignature.lower = lower;
	
	break;
    }
    case "/voice/note/add": {
	var stave = msg.args[0].value;
	var note = msg.args[1].value;
	var dur = msg.args[2].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	    staves[stave].notes = [];
	}

	if (staves[stave].notes === undefined) {
	    staves[stave].notes = [];
	}

	if (staves[stave].clef === undefined) {
	    staves[stave].clef = "treble";
	}

	if (staves[stave].dyn === undefined) {
	    staves[stave].dyn = "p";
	}

	// default position
	if (staves[stave].x === undefined) {
	    staves[stave].x = 10;
	}

	if (staves[stave].y === undefined) {
	    staves[stave].y = 10 + 100 * (Object.keys(staves).length - 1);
	}
	
	if (staves[stave].markcurrent === undefined) {
	    staves[stave].markcurrent = Boolean(false);
	}

	if (staves[stave].num_notes === undefined) {
	    staves[stave].num_notes = 8;
	}

	// default is 4/4
	if (staves[stave].timesignature === undefined) {
	    staves[stave].timesignature = {};
	    staves[stave].timesignature.upper = 4;
	    staves[stave].timesignature.lower = 4;
	}

	if (staves[stave].pad === undefined) {
	    staves[stave].pad = false;
	}

	let new_note = new StaveNote({ keys: [note], duration: dur, clef: staves[stave].clef });

	// Accidentals
	if (note.substring(1).includes("##")) {
	    new_note.addModifier(new Accidental("##"))
	} else if (note.substring(1).includes("#")) {
	    new_note.addModifier(new Accidental("#"))
	}

	if (note.substring(1).includes("bb")) {
	    new_note.addModifier(new Accidental("bb"))
	} else if (note.substring(1).includes("b")) {
	    new_note.addModifier(new Accidental("b"))
	}
	
	staves[stave].notes.push(new_note);
	
	if (staves[stave].notes.length > staves[stave].num_notes) {
	    staves[stave].notes.shift();
	}
	
	if (staves[stave].markcurrent) {
	    // set the current note to a different color ...
	    staves[stave].notes[0].setStyle({ fillStyle: "#000000", strokeStyle: "#000000" })
	    staves[stave].notes[1].setStyle({ fillStyle: "#FF0000", strokeStyle: "#FF0000" })
	    staves[stave].notes[2].setStyle({ fillStyle: "#000000", strokeStyle: "#000000" })
	}
	
	render();

	break;
    }
    case "/textfield/put": {
	var textfield = msg.args[0].value;
	var content = msg.args[1].value;
	var x = msg.args[2].value;
	var y = msg.args[3].value;

	if (textfields[textfield] === undefined) {
	    textfields[textfield] = {};
	}
	
	textfields[textfield].x = x;		
	textfields[textfield].y = y;	

	textfields[textfield].content = content;
	
	render();
	
	break;
    }

    case "/image/put": {
	var image = msg.args[0].value;
	var ref = msg.args[1].value;
	var x = msg.args[2].value;
	var y = msg.args[3].value;

	if (images[image] === undefined) {
	    images[image] = {};
	}
	
	images[image].x = x;		
	images[image].y = y;

	images[image].width = 200;		
	images[image].height = 200;	
	
	images[image].ref = ref;
	console.log(ref)
	
	render();
	
	break;
    }
    case "/clear": {	  	  
	self.staves = {}
	div.innerHTML = '';
    }
    }            
});
