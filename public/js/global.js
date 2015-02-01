var mouseDown = false;
var mousePos = {
	x : 0,
	y : 0
}
var lastPos = {
	x: 0,
	y: 0
}
var socket = io.connect();
var hasSynced = false;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var Brush = function(){
	this.size = 30,
	this.colour = getRandomColor(),
	this.brushType = "freeroam",

	this.setBrushType = function(type){
		this.brushType = type;
	},

	this.getBrushType = function(){
		return this.brushType;
	}

	this.setColour = function(newColour){
		this.colour = newColour;
	}
};

var brush = new Brush();

var name;
var randomNames = [
"Beulah	Wright", "Curtis	Fox", "Levi	Collins", "Gustavo	Russell", "Erica	Lowe", "Sherri	Mcbride", "Zachary	Martin", "Preston	Fletcher", "Jack	Shaw", "Chris	Carr", "Morris	Goodwin", "Raquel	Drake", "Sandy	Pearson", "Francis	Farmer", "Erika	Haynes", "Edgar	Warren", "Randal	Love", "Lucas	Cannon", "Ismael	Terry", "Rex	Alexander", "Russell	Houston", "Kenneth	Potter", "Ricky	James", "Latoya	Rivera", "Katherine	Chapman", "Gerald	Gomez", "Glenda	Robinson", "Adrian	Cox", "Maurice	Barton", "Harold	Hansen", "Nicole	Townsend", "Jorge	Waters", "Hugo	Hampton", "Stephen	Mcgee", "Marguerite	Conner", "Bill	Newman", "Rodney	Cook", "Santiago	Reid", "Toby	Casey", "Mamie	Allison", "Tami	Lawrence", "Tim	Crawford", "Paula	Carpenter", "Flora	Young", "Marian	Ferguson","Lewis	Carlson", "Nina	Wise", "Elisa	Hanson", "Shelly	Lucas", "Gabriel	Stevenson", "Elbert	Reeves", "Vicky	Jackson", "Cassandra	Moreno", "Becky	Todd", "Jimmy	Soto", "Opal	Hicks", "Darren	Mendoza", "Reginald	Watts", "Cesar	Sutton", "Lionel	Rodgers", "Christopher	Robertson", "Terrance	Byrd", "Kristy	Garza", "Herbert	Flowers", "Kirk	Schmidt", "Dennis	Thomas", "Essie	Henry", "Abel	Tucker", "Katrina	Phelps", "Rolando	Gonzalez", "Olga	Howard", "Cecilia	Cortez", "Tanya	Cohen", "Juanita	Rios", "Jeff	Davis", "Marty	Perkins", "Ian	Ortiz", "Andy	George", "Salvatore	Hamilton", "Verna	Barker", "Louise	Frank", "April	Nunez", "Bonnie	Ramirez", "Kay	Sherman", "Stacy	Nelson", "Lorraine	White", "Paul	Glover", "Otis	Woods", "Darrin	Guerrero", "Whitney	Underwood", "Henry	Graves", "Eula	Leonard", "Francis	Sanchez", "Hubert	Christensen", "Doug	Stanley", "Neal	Washington", "Everett	Harvey", "Nicholas	Hale", "Pedro	Ramsey", "Sadie	Stephens"]

function pickRandomName() {
	var rand = Math.floor(Math.random() * randomNames.length);
	return randomNames[rand];
}

function setNameTextBox() {
	var theName = pickRandomName();
	document.getElementById('name').value = theName;
	name = theName;
}

function init() {
	setNameTextBox();
}

function sync() {
	if(hasSynced == false) {
		var data = "";
		socket.emit('sync', data);
		hasSynced = true;
	}
}


/*
	Canvas Methods
*/

function clearCanvas() {
	context.fillStyle = "white";
   	context.fillRect(0, 0, canvas.width, canvas.height);
   	socket.emit('recieve canvas', canvas.toDataURL());
}


function draw() {
	var json = {
		x: mousePos.x,
		y: mousePos.y,
		lastX: lastPos.x,
		lastY: lastPos.y,
		size: brush.size,
		colour: brush.colour
	}
	drawLine(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
	/*drawRect(json.x, json.y, json.colour);*/
	socket.emit('send message', json);
}

function drawRect(x, y, colour) {
    context.fillStyle = colour;
	context.fillRect(x, y, 15, 15);
}

function drawCircle(x, y, size, colour) {
	//draw a circle
	context.lineTo(x, y);
	context.fillStyle = colour;
	context.beginPath();
	context.arc(x, y, size, 0, Math.PI*2, true); 
	context.closePath();
	context.fill();
}

function drawLine(x, y, lastX, lastY, size, colour) {
	context.strokeStyle = colour;
	context.lineWidth = size;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(lastX , lastY);
	context.lineTo(x,y);
	context.stroke();
}

socket.on('new message', function(data) {
	drawLine(data.x, data.y, data.lastX, data.lastY, data.size, data.colour);
});

socket.on('sync result', function(data) {
	var img = new Image();
	img.onload = function(){
	  context.drawImage(img,0,0); // Or at whatever offset you like
	};
	img.src = data.canvas;
});

socket.on('send canvas', function(data) {
	socket.emit('recieve canvas', canvas.toDataURL());
});

socket.on('user list', function(data) {
	clearUsers();
	if(data.length != 0) {
		for(var i = 0; i < data.length; i++) {
			if(data[i] != null) {
				if(data[i].name == name) {
					addUser(data[i].name + " (you)", data[i].colour);
				} else {
					addUser(data[i].name, data[i].colour);
				}
			}
		}
	}

});

socket.on('get online', function(data) {
	if(hasSynced == true) {
		var me = {
			name : name,
			colour: brush.colour
		}
		socket.emit('im online', me);
	} else {
		socket.emit('im not online');
	}
});	

function clearUsers() {
	var users = document.getElementById('users');
	users.innerHTML = "";
}

function addUser(name, colour) {
	var users = document.getElementById('users');
	var newUser = '<div id="' + name +  '" class="row"><div class="colour" style="background-color: ' + colour + ';"></div><div class="name">' + name + '</div></div>';
	users.innerHTML += newUser;
}

/**
** Helper Functions
**/

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
       	y: evt.clientY - rect.top
    };
}


//  Can be removed as it has been potentially replaced with brushSelection
function onMouseWheel(evt) {
     // Multi browser support
    var evt = window.event || evt; // old IE support
    var delta = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));

    if(delta > 0) {
    	if(brush.size >= 30) {
    		brush.size = 30;
    	} else {
    		brush.size++;
    	}
    } else {
    	if(brush.size <= 1) {
    		brush.size = 1
    	} else {
        	brush.size--;
    	}
    } 
}

// **
// Brushes
//

// Brush Lines 
// note: doesnt support other browsers gl
var brushSelection = document.getElementById('brushSelection');

brushSelection.addEventListener("click", function(evt){
	var value = getOptionSelected(brushSelection);
	brushSize(value);
});

function brushSize(newSize){
	brush.size = newSize;
}


// Use with html element select and option. Returns the value of the selected option. Parameter is the select element
function getOptionSelected(selectElement){
	return selectElement.options[selectElement.selectedIndex].value;
}


// look at this spag. Are you impressed?
function getColourOnCanvas(){
	var evt = window.event;
	var canvasRect = canvas.getBoundingClientRect();
	var mouseX = evt.clientX;
	var mouseY = evt.clientY;

	var x = mouseX - canvasRect.left;
	var y = mouseY - canvasRect.top;

	var data = context.getImageData(x,y, canvas.width, canvas.height);
	var pixels = data.data;

	var hexString = convertRGBToHex(pixels[0], pixels[1], pixels[2]);
	assignRGBToDom(pixels[0], pixels[1], pixels[2], hexString);
	var hex = assignSelectedHexColour();
	brush.setColour(hex);
	brush.setBrushType("freeroam");
}

/**
** Event Listeners
**/
if (canvas.addEventListener) {
	// IE9, Chrome, Safari, Opera
	canvas.addEventListener("mousewheel", onMouseWheel, false);
    // Firefox
    canvas.addEventListener("DOMMouseScroll", onMouseWheel, false);
}
// IE 6/7/8
else {
	canvas.attachEvent("onmousewheel", onMouseWheel);
}

canvas.addEventListener('mousemove', function(evt) {
	lastPos = mousePos;
	mousePos = getMousePos(canvas, evt);
	if(mouseDown === true && brush.getBrushType() === "freeroam") {
		draw();
	}
}, false);

canvas.addEventListener("mousedown", function(evt) {
	canvas.className = "dragged";
	if(evt.button === 0) {
    	mouseDown = true;
    	if(mouseDown === true && brush.brushType === "dropper"){
    		getColourOnCanvas();
    	}
	} else {
		brush.colour = getRandomColor();
	}
});
canvas.addEventListener("mouseup", function(evt) {
	canvas.className = ""; // Reverts to no classname
	if(evt.button === 0) {
    	mouseDown = false;
	}
});

document.getElementById('clearCanvas').addEventListener('click', function(evt){
	clearCanvas();
})

document.getElementById('colourDrop').addEventListener('click', function(evt){
	brush.setBrushType('dropper');
});

document.getElementById('freeroamBrush').addEventListener('click', function(evt){
	brush.setBrushType('freeroam');
})
