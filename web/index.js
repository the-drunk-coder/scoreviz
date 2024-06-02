// get vexflow API
const VF = Vex.Flow;

var div = document.getElementById("boo")

var staves = {};

function render(name) {
    // clear score first ... this is not very efficient I suppose,    
    div.innerHTML = '';
    
    var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

    let vis_len = 500; //staves[name].length * 100;
    
    // Configure the rendering context.
    renderer.resize(vis_len, 500);
    
    var context = renderer.getContext();
    context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
    
    // Create a stave of dynamic width at position 10, 40 on the canvas.
    var stave = new VF.Stave(10, 40, vis_len);
    
    // Add a clef and time signature.
    stave.addClef("treble")
    
    var voice = new VF.Voice({num_beats: staves[name].length,  beat_value: 4}).setStrict(false);

    // Connect it to the rendering context and draw!
    stave.setContext(context).draw();
    
    // Create a voice in 4/4 and add above notes
    voice.addTickables(staves[name])

    var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);

    // Render voice
    voice.draw(context, stave);
}

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {

    switch(msg.address) {
	
    case "/stave/dyn": {
	var stave = msg.args[0].value;
	var dyn = msg.args[1].value;
    }
    case "/note/add": {
	var stave = msg.args[0].value;
	var note = msg.args[1].value;
	
	if (staves[stave] === undefined) {
	    staves[stave] = [];
	}
	
	staves[stave].push(new VF.StaveNote({ keys: [note], duration: "q" }));

	render(stave);

	break;
    }
    case "/clear": {	  	  
	
    }
    }            
});
