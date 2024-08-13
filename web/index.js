// get vexflow API
//const VF = Vex.Flow;
const { Formatter, Renderer, Stave, StaveNote, TextNote, Dot, Voice } = Vex.Flow;

var staves = {};
var textfields = {};

// desired functions:

// - score name
// - group staves, 
// - cute additions (emojis for playing style ?)
// - "snippet mode" bs "rt mode (change always, mark current)"

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
// INCOMPLETE
function notes_to_measures(notes, lower, upper) {
    let inner_notes = notes.slice();

    let measures = [];
    let measure = [];

    let ticks_to_fill_per_bar = upper * (16384 / lower);

    let num_notes = inner_notes.length;
    
    for (var i = 0; i < num_notes; i++) {
	
	let note = inner_notes.shift();

	if (note.intrinsicTicks <= ticks_to_fill_per_bar) {	    
	    measure.push(note);
	    ticks_to_fill_per_bar -= note.intrinsicTicks
	} else {
	    // reset current measure
	    measures.push(measure);
	    measure = [];
	    ticks_to_fill_per_bar = upper * (16384 / lower);
	    // add note 
	    measure.push(note);
	    ticks_to_fill_per_bar -= note.intrinsicTicks
	}
    }

    // fill bar with rest
    if (ticks_to_fill_per_bar > 0) {
	let rests = ticks_to_sym(ticks_to_fill_per_bar);

	for (const [num, rest] of Object.entries(rests)) {
	    
	    var rest_note;
	    if (rest[1] >>> 0) {

		let ds = "";

		for (var d = 0; d < rest[1]; d++){
		    ds += "d";
		}

		rest_note = new StaveNote({ keys: ["b/4"], duration: rest[0] + ds + "r"});

		for (var d = 0; d < rest[1]; d++) {
		    dotted(rest_note);
		}
	    	
	    } else {
		console.log(rest);
		rest_note = new StaveNote({ keys: ["b/4"], duration: rest[0] + "r"});	    
	    }

	    measure.push(rest_note);
	}
    }

    // last measure
    measures.push(measure);
    
    return measures;
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

	let measures = notes_to_measures(
	    stave_props.notes,
	    stave_props.timesignature.upper,
	    stave_props.timesignature.lower
	);

	// estimate width
	let rect_width = stave_props.x + (measures.length * 240) + 80;
	
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
	    label.setAttributeNS(null, 'x', stave_props.x + rect_width - 30);
	    label.setAttributeNS(null, 'y', stave_props.y + 70);
	    label.setAttributeNS(null, 'fill', '#000');
	    label.setAttributeNS(null, 'font-size', '30');
	    label.textContent = stave_props.label;
	    svg.appendChild(label);	   
	}
	
	const stave_measure_0 = new Stave(stave_props.x, stave_props.y, 280);
	stave_measure_0
	    .addClef("treble")
	    .addTimeSignature(stave_props.timesignature.upper + "/" + stave_props.timesignature.upper)	    
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
	
	
	let notes_measure_0 = measures.shift();
	
	// Helper function to justify and draw a 4/4 voice
	Formatter.FormatAndDraw(context, stave_measure_0, notes_measure_0);
	Formatter.FormatAndDraw(context, stave_measure_0, [dyn, stave_name]);
	
	let width = stave_measure_0.width + stave_measure_0.x;
	
	for (const [n, notes_measure] of Object.entries(measures)) {
	    const stave_measure = new Stave(width, stave_props.y, 240);	   
	    stave_measure.setContext(context).draw();	    	    
	    Formatter.FormatAndDraw(context, stave_measure, notes_measure);
	    width += stave_measure.width;
	}	
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
	console.log(length);
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
	
	staves[stave].notes.push(new StaveNote({ keys: [note], duration: dur, clef: staves[stave].clef }));
	
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
    case "/textfield/content": {
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
    case "/clear": {	  	  
	self.staves = {}
	div.innerHTML = '';
    }
    }            
});
