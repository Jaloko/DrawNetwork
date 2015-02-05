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
context.imageSmoothingEnabled = false;

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
"Beulah Wright", "Curtis Fox", "Levi Collins", "Gustavo	Russell", "Erica Lowe", "Sherri Mcbride", "Zachary Martin", "Preston Fletcher", "Jack Shaw", "Chris Carr", "Morris Goodwin", "Raquel Drake", "Sandy Pearson", "Francis Farmer", "Erika Haynes", "Edgar Warren", "Randal Love", "Lucas Cannon", "Ismael Terry", "Rex Alexander", "Russell Houston", "Kenneth Potter", "Ricky James", "Latoya Rivera", "Katherine Chapman", "Gerald Gomez", "Glenda Robinson", "Adrian Cox", "Maurice Barton", "Harold Hansen", "Nicole Townsend", "Jorge Waters", "Hugo Hampton", "Stephen Mcgee", "Marguerite Conner", "Bill Newman", "Rodney Cook", "Santiago Reid", "Toby Casey", "Mamie Allison", "Tami Lawrence", "Tim Crawford", "Paula Carpenter", "Flora Young", "Marian Ferguson","Lewis Carlson", "Nina Wise", "Elisa Hanson", "Shelly Lucas", "Gabriel Stevenson", "Elbert Reeves", "Vicky Jackson", "Cassandra Moreno", "Becky Todd", "Jimmy Soto", "Opal Hicks", "Darren Mendoza", "Reginald Watts", "Cesar Sutton", "Lionel Rodgers", "Christopher Robertson", "Terrance Byrd", "Kristy Garza", "Herbert Flowers", "Kirk Schmidt", "Dennis Thomas", "Essie Henry", "Abel Tucker", "Katrina Phelps", "Rolando Gonzalez", "Olga Howard", "Cecilia Cortez", "Tanya Cohen", "Juanita Rios", "Jeff Davis", "Marty Perkins", "Ian Ortiz", "Andy George", "Salvatore Hamilton", "Verna Barker", "Louise Frank", "April Nunez", "Bonnie Ramirez", "Kay Sherman", "Stacy Nelson", "Lorraine White", "Paul Glover", "Otis Woods", "Darrin Guerrero", "Whitney Underwood", "Henry Graves", "Eula Leonard", "Francis Sanchez", "Hubert Christensen", "Doug Stanley", "Neal Washington", "Everett Harvey", "Nicholas Hale", "Pedro Ramsey", "Sadie Stephens"];
var connectedUsers;

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
	webGLStart();
}

function sync() {
	if(hasSynced == false) {
		name = document.getElementById('name').value;
		var data = "";
		var me = {
			name : document.getElementById('name').value,
			colour: brush.colour
		}
		socket.emit('im online', me);
	}
}

socket.on('user validated', function() {
	socket.emit('sync');
	// This needs to be fixed so you cant draw until synced
});

socket.on('sync draw', function(data) {
	drawLine(data.x, data.y, data.lastX, data.lastY, data.size, data.colour);
});

socket.on('sync result', function(data) {
	if(data != null) {
		var img = new Image();
		img.onload = function(){
		  	context.drawImage(img,0,0); // Or at whatever offset you like
		};
		img.src = data;
	}
	hasSynced = true;
});

socket.on('send canvas', function() {
	socket.emit('recieve canvas', canvas.toDataURL());
});

socket.on('user list', function(data) {
	clearUsers();
	if(data.length != 0) {
		connectedUsers = data.length;
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

socket.on('recieve clear canvas', function() {
	context.fillStyle = "white";
   	context.fillRect(0, 0, canvas.width, canvas.height);
});


/*
	Canvas Methods
*/

function clearCanvas() {
	context.fillStyle = "white";
   	context.fillRect(0, 0, canvas.width, canvas.height);
   	socket.emit('clear canvas');
}


function draw() {
	console.log(connectedUsers);
	var json = {
		name: name,
		x: mousePos.x,
		y: mousePos.y,
		lastX: lastPos.x,
		lastY: lastPos.y,
		size: brush.size,
		colour: brush.colour
	}
	drawLine(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
	/*drawRect(json.x, json.y, json.colour);*/
	socket.emit('draw', json);
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

// Fired when just before you leave the site
window.addEventListener("beforeunload", function (e) {
	if(connectedUsers != null) {
		if(connectedUsers == 1) {
			socket.emit('store canvas', canvas.toDataURL());
		}
	}
	var me = {
		name : name,
		colour: brush.colour
	};
	socket.emit('im offline', me);
});	

function clearUsers() {
	var users = document.getElementById('users');
	users.innerHTML = "";
}

function addUser(name, colour) {
	var users = document.getElementById('users');
	var newUser = '<div id="' + name + '" class="row"><div class="colour" style="background-color: ' + colour + ';"></div><div class="name">' + name + '</div></div>';
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

function getMousePos(evt) {
	// Scroll bar offsets
	var doc = document.documentElement;
	var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    return {
        x: evt.clientX + left,
       	y: evt.clientY + top
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

/*
// look at this spag. Are you impressed?
function getColourOnCanvas(){
	var canvasRect = canvas.getBoundingClientRect();

	var x = mousePos.x - canvasRect.left;
	var y = mousePos.y - canvasRect.top;

	var data = context.getImageData(x,y, x, y);
	var pixels = data.data;
	var hexString = convertRGBToHex(pixels[0], pixels[1], pixels[2]);
	assignRGBToDom(pixels[0], pixels[1], pixels[2], hexString);
	var hex = assignSelectedHexColour();

	var rgba = {
		r: pixels[0],
		g: pixels[1],
		b: pixels[2],
		a: pixels[3]
	};
	var colour = {
		hex: hex,
		rgba: rgba
	};

	return colour;
}*/

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

document.addEventListener('mousemove', function(evt) {
	lastPos = mousePos;
	mousePos = getMousePos(evt);
	if(mouseDown === true && brush.getBrushType() === "freeroam") {
		if(hasSynced == true) {
			if(mouseIsHoveringCanvas(canvas)) {
				draw();
			}
			changeColour();
		}
	}
}, false);

document.addEventListener("mousedown", function(evt) {
	canvas.className = "dragged";
	if(evt.button === 0) {
    	mouseDown = true;
    	if(mouseDown === true) {
    		// Located in colour-picker2.js
		    if(canMoveTintPointer == false) {
		        if(mouseIsHoveringCanvas(tintCanvas)) {
		            canMoveTintPointer = true;
		        }  
		    }
    		if(hasSynced == true) {
    			if(brush.brushType === "dropper"){
    				var hex = convertRGBToHex(getColourOnCanvas(canvas, context).r, getColourOnCanvas(canvas, context).g, getColourOnCanvas(canvas, context).b);
		    		brush.setColour(hex);
					brush.setBrushType("freeroam");
				} else if(brush.brushType === "fillBucket") {
					fillBucket(context, brush.colour);
					brush.setBrushType("freeroam");
				}
				changeColour();
    		}
    	}
	} else {
		brush.colour = getRandomColor();
	}
});
document.addEventListener("mouseup", function(evt) {
	canvas.className = ""; // Reverts to no classname
	if(evt.button === 0) {
    	mouseDown = false;
	   // Located in colour-picker2.js
	    if(canMoveTintPointer == true) {
	        canMoveTintPointer = false;
	    }
	}
});

document.getElementById('clearCanvas').addEventListener('click', function(evt){
	clearCanvas();
})

document.getElementById('colourDrop').addEventListener('click', function(evt){
	brush.setBrushType('dropper');
});

document.getElementById('fillBucket').addEventListener('click', function(evt){
	brush.setBrushType('fillBucket');
});