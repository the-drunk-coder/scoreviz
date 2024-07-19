// get vexflow API
const VF = Vex.Flow;

var div = document.getElementById("boo")

var staves = {};
var textfields = {};

// desired functions:

// - score name
// - group staves, 
// - cute additions (emojis for playing style ?)
// - "snippet mode" bs "rt mode (change always, mark current)"
// - text snippets in random positions

// - [x] transpose notes according to clef (vexflow does it after all)
// - [x] put a color background
// - [x] position staves
// - [x] name staves
// - [x] stave history, between 1 and 4 notes?
// - [x] dynamic mark on stave
// - [x] clef for stave
// - [x] color "active" note

function render() {
    // clear score first ... this is not very efficient I suppose,    
    div.innerHTML = '';
    
    var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    
    var max_len = 0;
    var spacing = 60;
    
    // Configure the rendering context.    
    var context = renderer.getContext();
    // this has no effect ?
    
    context.setFont("mononoki", 10, "");
    
    var v_idx = 0;

    let svg = document.getElementsByTagName('svg')[0];
   
    // render staves 
    for (const [name, stave_props] of Object.entries(staves)) {
	
	let vis_len = stave_props.x + stave_props.notes.length * spacing;

	renderer.resize(1000, 1000);
	 
	// Create a stave of dynamic width at position 10, 40 on the canvas.
	var stave = new VF.Stave(stave_props.x, stave_props.y, vis_len);

	// create a background color if defined, as an SVG rectangle
	// (vexflow doesn't have facilities for this by itself)
	if (stave_props.bgcolor) {
	    var svgns = "http://www.w3.org/2000/svg";
	    var rect = document.createElementNS(svgns, 'rect');
	    rect.setAttributeNS(null, 'x', stave_props.x);
	    rect.setAttributeNS(null, 'y', stave_props.y + 12);
	    rect.setAttributeNS(null, 'height', 90);
	    rect.setAttributeNS(null, 'width', vis_len);
	    rect.setAttributeNS(null, 'fill', '#' + stave_props.bgcolor);
	    svg.appendChild(rect);
	}

	if (stave_props.label) {
	    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	    label.setAttributeNS(null, 'x', stave_props.x + vis_len + 12);
	    label.setAttributeNS(null, 'y', stave_props.y + 70);
	    label.setAttributeNS(null, 'fill', '#000');
	    label.setAttributeNS(null, 'font-size', '30');
	    label.textContent = stave_props.label;
	    svg.appendChild(label);	   
	}
				
	v_idx = v_idx + 1;
	
	// Add a clef and time signature.
	stave.addClef(stave_props.clef).setContext(context).draw();
			
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
	    .setStave(stave)
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
	    .setStave(stave)
	    .setJustification(VF.TextNote.Justification.LEFT);
	
	
	// Connect it to the rendering context and draw!
	stave.setContext(context).draw();
	
	// Create a voice in 4/4 and add above notes
	var voice = new VF.Voice({num_beats: stave_props.notes.length,  beat_value: 1}).setStrict(false);
	var decorations = new VF.Voice({num_beats: 3,  beat_value: 1}).setStrict(false);
	
	voice.addTickables(stave_props.notes);
	decorations.addTickables([stave_name, dyn]);
	
	var formatter = new VF.Formatter().joinVoices([voice,decorations]).format([voice,decorations], stave_props.notes.length * spacing);

	// Render voice
	voice.draw(context, stave);
	stave_name.setContext(context).draw();
	dyn.setContext(context).draw();	
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
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {
    
    switch(msg.address) {
	
    case "/voice/pos": {
	var stave = msg.args[0].value;
	var x = msg.args[1].value;
	var y = msg.args[2].value;	

	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].x = x;
	staves[stave].y = y;
	
	break;
    }
    case "/voice/bgcolor": {
	var stave = msg.args[0].value;
	var col = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = {};
	}
	
	staves[stave].bgcolor = col;
		
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

	if (staves[stave].x === undefined) {
	    staves[stave].x = 10;
	}

	if (staves[stave].y === undefined) {
	    staves[stave].y = 10 + 100 * (Object.keys(staves).length - 1);
	}
     
	staves[stave].notes.push(new VF.StaveNote({ keys: [note], duration: dur, clef: staves[stave].clef }));
	
	if (staves[stave].notes.length > 3) {
	    staves[stave].notes.shift();
	}

	// set the current note to a different color ...
	staves[stave].notes[0].setStyle({ fillStyle: "#000000", strokeStyle: "#000000" })
	staves[stave].notes[1].setStyle({ fillStyle: "#FF0000", strokeStyle: "#FF0000" })
	staves[stave].notes[2].setStyle({ fillStyle: "#000000", strokeStyle: "#000000" })
		
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
