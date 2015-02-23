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
var pointerCanvas = document.getElementById('pointer-canvas');
var pointerContext = pointerCanvas.getContext('2d');
var canDraw = false;
var gradientTimer = 0;

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
var currentlyVoting = false;
var readyForText = false;
var textToRender = "";
var textFont = "20px Arial";
var textPos = {
	x: 0,
	y: 0
}
var canvasRect = canvas.getBoundingClientRect();

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
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);
	setNameTextBox();
	webGLStart();
}


function createRoom() {
	var isPublic = document.getElementById('myonoffswitch').checked;
	socket.emit('create room', isPublic);
}


function joinRoom() {
	insertURLParam("room", selectedRoom);
}

function searchRoom() {
	var table = document.getElementById('room-list');
	var row = table.rows;
	var roomSearch = document.getElementById('room-search');
	for(var i = 1; i < row.length; i++) {
		row[i].className = "";
		if(roomSearch.value != "") {
			if(row[i].cells[0].innerHTML.indexOf(roomSearch.value) == -1) {
				 row[i].className = "invisible";
			}
		}
	}
}

socket.on('room result', function(data) {
	insertURLParam("room", data);
});

function sync() {
	if(hasSynced == false) {
		name = document.getElementById('name').value;
		socket.emit('join room', getURLParam('room'));
	}
}

socket.on('room verification', function() {
	var me = {
		id: getURLParam('room'),
		name : name,
		colour: brush.colour
	}
	socket.emit('im online', me);
});

socket.on('user validated', function() {
	socket.emit('sync');
	// Hide enter name box
	document.getElementById('name-wrap').className = "invisible";
});

socket.on('sync draw', function(data) {
	drawCircle(data.x, data.y, data.lastX, data.lastY, data.size, data.colour);
});

socket.on('sync draw text', function(data) {
	drawText(data.x, data.y, data.font, data.colour, data.text);
});

socket.on('sync erase', function(data) {
	drawRect(data.x, data.y, data.lastX, data.lastY, data.size, "white");
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

socket.on('send vote clear', function(data) {
	currentlyVoting = true;
	var clearVoteBox = document.getElementById('clear-canvas-vote-box');
	clearVoteBox.className = "";
	document.getElementById('timeRemain').innerHTML = data;
});

socket.on('send clear vote timer', function(data) {
	var clearVoteBox = document.getElementById('clear-canvas-vote-box');
	clearVoteBox.className = "";
	document.getElementById('clear-wrap').className ="table-visible";
	document.getElementById('result').className = "invisible";
	document.getElementById('time').className = "";
	document.getElementById('timeRemain').innerHTML = data.timeRemaining;
	document.getElementById('pYes').innerHTML = "Yes: " + data.yesVotes;
	document.getElementById('pNo').innerHTML = "No: " + data.noVotes;
	document.getElementById('pTotal').innerHTML = "Total Possible: " + data.total;
	if(currentlyVoting === false) {
		document.getElementById('voteButtons').className = "invisible";
	}
});

socket.on('send clear vote result', function(data) {
	document.getElementById('result').className = "";
	document.getElementById('time').className = "invisible";
	document.getElementById('resultData').innerHTML = data;
});

socket.on('cannot start vote', function(data) {
	// This fixes the invisible buttons bug for some reason
	document.getElementById('voteButtons').className = "";	
	alert("Cannot vote to clear for another: " + data + " seconds.");
});

socket.on('unlock canvas', function(data) {
	currentlyVoting = false;
	document.getElementById('clear-wrap').className = "invisible";
	document.getElementById('voteButtons').className = "";	
});

function clearVote(vote) {
	socket.emit('recieve clear vote', vote);
	document.getElementById('voteButtons').className = "invisible";
}

/*
	Canvas Methods
*/

function clearCanvas() {
   	socket.emit('vote clear');
	document.getElementById('voteButtons').className = "invisible";
}

function drawBrushOutline(x, y) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'white';
    pointerContext.arc(x - cr.left, y - cr.top, brush.size / 2,0,2*Math.PI);
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'black';
    pointerContext.arc(x - cr.left, y - cr.top, brush.size / 2,0,2*Math.PI);
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'white';
    pointerContext.arc(x - cr.left, y - cr.top, brush.size / 2,0,2*Math.PI);
    pointerContext.stroke();
}

function drawEraserOutline(x, y) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.beginPath();
    pointerContext.rect(x - cr.left - brush.size / 2, y - cr.top - brush.size / 2, brush.size, brush.size);
    pointerContext.strokeStyle = 'white';
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.rect(x - cr.left - brush.size / 2, y - cr.top - brush.size / 2, brush.size, brush.size);
    pointerContext.strokeStyle = 'black';
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.rect(x - cr.left - brush.size / 2, y - cr.top - brush.size / 2, brush.size, brush.size);
    pointerContext.strokeStyle = 'white';
    pointerContext.stroke();
}

function draw() {
	if(currentlyVoting == false) {
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: brush.size,
			colour: brush.colour
		}
		drawCircle(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
		socket.emit('draw', json);
	}
}

function erase() {
	if(currentlyVoting == false) {
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: brush.size,
			colour: brush.colour
		}
		drawRect(json.x, json.y, json.lastX, json.lastY, json.size, "white");
		socket.emit('erase', json);
	}
}

function gradientDraw(timer) {
	canvasRect = canvas.getBoundingClientRect();
	if(currentlyVoting == false) {
		var rgb = convertHexToRGB(brush.colour);
		rgb.r -= timer;
		rgb.g -= timer;
		rgb.b -= timer;
		if(rgb.r <= 0) {
			rgb.r = 0;
		}
		if(rgb.g <= 0) {
			rgb.g = 0;
		}

		if(rgb.b <= 0) {
			rgb.b = 0;
		}
		var hex = convertRGBToHex(rgb.r, rgb.g, rgb.b);
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: brush.size,
			colour: hex
		}
		drawLine(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
		socket.emit('draw', json);
	}
}

function distanceBetween(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}
function angleBetween(point1, point2) {
  return Math.atan2( point2.x - point1.x, point2.y - point1.y );
}

function drawRect(curX, curY, lastX, lastY, size, colour) {
	canvasRect = canvas.getBoundingClientRect();
	var lastP = {
		x: lastX,
		y: lastY
	},
	curP = {
		x: curX,
		y: curY
	}
	var dist = distanceBetween(lastP, curP);
  	var angle = angleBetween(lastP, curP);
    for (var i = 0; i < dist; i+=5) {
	    x = lastP.x + (Math.sin(angle) * i);
	    y = lastP.y + (Math.cos(angle) * i);
	    context.fillStyle = colour;
		context.fillRect(x - size / 2, y - size / 2, size, size);
    }
}

function drawCircle(curX, curY, lastX, lastY, size, colour) {
	canvasRect = canvas.getBoundingClientRect();
	var lastP = {
		x: lastX,
		y: lastY
	},
	curP = {
		x: curX,
		y: curY
	}
	var dist = distanceBetween(lastP, curP);
  	var angle = angleBetween(lastP, curP);
    for (var i = 0; i < dist; i+=5) {
	    x = lastP.x + (Math.sin(angle) * i);
	    y = lastP.y + (Math.cos(angle) * i);
	    context.beginPath();
	   	context.fillStyle = colour;
	    context.arc(x, y, size / 2, false, Math.PI * 2, false);
	    context.closePath();
	    context.fill();
    }
}

function drawLine(x, y, lastX, lastY, size, colour) {
	context.strokeStyle = colour;
	context.lineWidth = size;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(lastX, lastY);
	context.lineTo(x,y);
	context.stroke();
}

function drawNormalLine(x, y, lastX, lastY, size) {
	context.strokeStyle = "white";
	context.lineWidth = size;
	context.lineCap = "square";
	context.beginPath();
	context.moveTo(lastX, lastY);
	context.lineTo(x,y);
	context.stroke();
}

var myEvent = window.attachEvent || window.addEventListener;
var chkevent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compitable

// Fired when just before you leave the site
// It appears the problem here was that it cant send 2 socket.emits()
myEvent(chkevent, function(e) { // For >=IE7, Chrome, Firefox
	var me = {
		name: name,
		colour: brush.colour
	};
	if(connectedUsers == 1) {
		me.canvas = canvas.toDataURL();
		socket.emit('im offline store canvas', me);
	} else {
		socket.emit('im offline', me);
	}
});

function clearUsers() {
	var users = document.getElementById('users');
	users.innerHTML = "";
}

function addUser(name, colour) {
	var users = document.getElementById('users');
	var newUser = '<div id="' + name + '"class="row">'
						+ '<div class="user-colour" style="background-color: ' + colour + '">'
						+ '</div>'
						+ '<div class="user-name">'
							+ name +
						'</div>'
					+ '</div>';
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
    return {
        x: evt.clientX,
       	y: evt.clientY
    };
}


//  Can be removed as it has been potentially replaced with brushSelection

// **
// Brushes
//

// Brush Lines 
// note: doesnt support other browsers gl
var brushSelection = document.getElementById('brushSelection');

brushSelection.addEventListener("input", function(evt){
	brushSize(this.value);
});

var textSizeSel = document.getElementById('textSizeSel');
textSizeSel.addEventListener("input", function(evt){
	changeTextSize(this.value);
});

function changeFont() {
	var e = document.getElementById("fontSel");
	var font = e.options[e.selectedIndex].value;
	var split = textFont.split(" ");
	textFont = split[0] + " " + font;
	drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);
}
function changeTextSize(newSize){
	var e = document.getElementById("fontSel");
	var font = e.options[e.selectedIndex].value;
	textFont = newSize + "px " + font;
	drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);
}

function brushSize(newSize){
	brush.size = newSize;
}

function inputColourChange() {
	var rgb = {
		r: document.getElementById("rValue").value | 0,
		g: document.getElementById("gValue").value | 0,
		b: document.getElementById("bValue").value | 0
	};
	onColourChange(rgb);
}

function onHexChange() {
	if(document.getElementById("hexValue").value.length == 7) {
		var rgb = convertHexToRGB(document.getElementById("hexValue").value);
		onColourChange(rgb);
	}
}

function onColourChange(rgb) {
	var hex = convertRGBToHex(rgb.r, rgb.g, rgb.b);
	var hsv = convertRGBToHSV(rgb.r, rgb.g, rgb.b);
	tintPointer = {
		x: Math.ceil((100 - hsv.s) * 2.55),
		y: Math.ceil((100 - hsv.v) * 2.55)
	};
	huePointer = {
		y: Math.ceil((360 - hsv.h) / 360 * 255)
	};
	updateColour();
	brush.setColour(hex);
}

function drawText(x, y, font, colour, text) {
	context.font=font;
	context.fillStyle = colour;
	context.fillText(text,x,y) ;
}


function drawTempText(x, y, font, colour, text) {
	var cr = pointerCanvas.getBoundingClientRect();
    pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.font=font;
	pointerContext.fillStyle = colour;
	pointerContext.fillText(text,x - cr.left ,y - cr.top);
}

function applyText() {
	if(readyForText == true) {
		var cr = canvas.getBoundingClientRect();
		var data = {
			x: textPos.x - cr.left,
			y: textPos.y - cr.top,
			font: textFont,
			colour: brush.colour,
			text: textToRender
		};
		socket.emit('draw text', data);
		drawText(data.x, data.y, textFont, data.colour, textToRender);
		textToRender = "";
		document.getElementById('text-tool-text').value = "";
		drawTempText(textPos.x, textPos.y, textFont, data.colour, textToRender);
		readyForText = false;
		document.getElementById('text-tool-text').blur();
	}
}

document.addEventListener('mousemove', function(evt) {
	lastPos = mousePos;
	mousePos = getMousePos(evt);
	if(brush.brushType === "freeroam" || brush.brushType === "gradient-brush" || brush.brushType === "dropper") {
		drawBrushOutline(mousePos.x, mousePos.y);
	} else if(brush.brushType === "eraser"){
		drawEraserOutline(mousePos.x, mousePos.y);
	}
	if(mouseDown === true) {
		if(hasSynced == true) {
			if(brush.getBrushType() === "freeroam") {
				if(canDraw == true) {
					draw();
				}	
			} else if(brush.getBrushType() === "gradient-brush") {
				if(canDraw == true) {
					gradientTimer++;
					gradientDraw(gradientTimer);
				}	

			} else if(brush.brushType === "eraser"){
		    	if(canDraw === true) {
		    		erase();
				}
			} else if(brush.brushType === "text"){
		    	if(canDraw === true) {
		    		textPos = mousePos;
				}
				drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);
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
    		if(hasSynced === true) {
	    		if(canMoveTintPointer === false) {
			        if(mouseIsHoveringCanvas(tintCanvas)) {
			            canMoveTintPointer = true;
			            canDraw = false;
			        }  
			    }
			    // To stop drawing when dragging tint pointer
			    if(canDraw === false) {
	    			if(mouseIsHoveringCanvas(canvas)) {
						canDraw = true;
					}
	    		}
	    		changeColour();
			    if(brush.brushType === "freeroam") {
			    	if(canDraw === true) {
			    		draw();
			    	}
			    } else if(brush.brushType === "gradient-brush") {
			    	if(canDraw === true) {
			    		gradientTimer = 0;
			    		gradientDraw(gradientTimer);
	    			}
			    } else if(brush.brushType === "dropper"){
			    	if(mouseIsHoveringCanvas(canvas)) {
	    				var rgb = getColourOnCanvas(canvas, context);
						onColourChange(rgb);
					}
				} else if(brush.brushType === "text"){
			    	if(canDraw === true) {
			    		readyForText = true;
			    		textPos = mousePos;
					}
					drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);
				} else if(brush.brushType === "eraser"){
			    	if(canDraw === true) {
		    			erase();
					}
				} else if(brush.brushType === "fillBucket") {
					fillBucket(context, brush.colour);
					brush.setBrushType("freeroam");
				}
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

    	if(canDraw == true) {
			canDraw = false;
		}
	}
});

document.body.addEventListener("keydown", function(e) {
	if(readyForText === true) {
		document.getElementById('text-tool-text').focus();
		drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);
		if(e.keyCode == 13) {
	    	applyText();
	    }
	}
});
 
document.body.addEventListener("keyup", function(e) {
	if(readyForText === true) {
		textToRender = document.getElementById('text-tool-text').value;
		drawTempText(textPos.x, textPos.y, textFont, brush.colour, textToRender);	
	}
});

document.getElementById('clearCanvas').addEventListener('click', function(evt){
	clearCanvas();
})

document.getElementById('brush').addEventListener('click', function(evt){
	brush.setBrushType('freeroam');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
});

document.getElementById('colourDrop').addEventListener('click', function(evt){
	brush.setBrushType('dropper');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('dropper-settings').className = "";
});

document.getElementById('gradient-brush').addEventListener('click', function(evt){
	brush.setBrushType('gradient-brush');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
});

document.getElementById('saveCanvas').addEventListener('click', function(evt){
	window.open(canvas.toDataURL());
});

document.getElementById('text-tool').addEventListener('click', function(evt){
	brush.setBrushType('text');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('canvas').style.cursor = "text";
	document.getElementById('pointer-canvas').style.cursor = "text";
	document.getElementById('text-settings').className = "";
});

document.getElementById('eraser').addEventListener('click', function(evt){
	brush.setBrushType('eraser');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
});

function resetTools() {
	textToRender = "";
	readyForText = false;
	// Tools
	document.getElementById('brush').className = "button tool";
	document.getElementById('colourDrop').className = "button tool";
	document.getElementById('gradient-brush').className = "button tool";
	document.getElementById('text-tool').className = "button tool";
	document.getElementById('eraser').className = "button tool";
	// Tool Settings
	document.getElementById('brush-settings').className = "invisible";
	document.getElementById('dropper-settings').className = "invisible";
	document.getElementById('text-settings').className = "invisible";
	// Canvases
	document.getElementById('canvas').style.cursor = "none";
	document.getElementById('pointer-canvas').style.cursor = "none";
}

/*document.getElementById('fillBucket').addEventListener('click', function(evt){
	brush.setBrushType('fillBucket');
});
*/