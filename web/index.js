// get vexflow API
const VF = Vex.Flow;

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
    
    if (ticks_to_fill_per_bar > 0) {
	// add rests ...
    }

    // last measure
    measures.push(measure);
    
    return measures;
}

var div = document.getElementById("boo");

function render() {
    
    // clear score first ... this is not very efficient I suppose, 
    div.innerHTML = '';

    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(1200, 1200);
    
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
	
	const stave_measure_0 = new VF.Stave(stave_props.x, stave_props.y, 280);
	stave_measure_0
	    .addClef("treble")
	    .addTimeSignature(stave_props.timesignature.upper + "/" + stave_props.timesignature.upper)	    
	    .setContext(context)
	    .draw();

	var stave_name = new VF.TextNote({
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
	    .setJustification(VF.TextNote.Justification.LEFT);
	
	var dyn = new VF.TextNote({
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
	    .setJustification(VF.TextNote.Justification.LEFT);
	
	
	let notes_measure_0 = measures.shift();
	
	// Helper function to justify and draw a 4/4 voice
	VF.Formatter.FormatAndDraw(context, stave_measure_0, notes_measure_0);
	VF.Formatter.FormatAndDraw(context, stave_measure_0, [dyn, stave_name]);
	
	let width = stave_measure_0.width + stave_measure_0.x;
	
	for (const [n, notes_measure] of Object.entries(measures)) {
	    const stave_measure = new VF.Stave(width, stave_props.y, 240);	   
	    stave_measure.setContext(context).draw();	    	    
	    VF.Formatter.FormatAndDraw(context, stave_measure, notes_measure);
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

	// default is 4/4
	if (staves[stave].timesignature === undefined) {
	    staves[stave].timesignature = {};
	    staves[stave].timesignature.upper = 4;
	    staves[stave].timesignature.lower = 4;
	}
	
	staves[stave].notes.push(new VF.StaveNote({ keys: [note], duration: dur, clef: staves[stave].clef }));
	
	//if (staves[stave].notes.length > 3) {
	//    staves[stave].notes.shift();
	//}
	
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
