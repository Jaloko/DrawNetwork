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

var tool = new ToolSet();
	
var name;
var randomNames;
var connectedUsers;
var currentlyVoting = false;
var readyForText = false;
var currentlySaving = false;
var textToRender = "";
var textFont = "20px Arial";
var textPos = {
	x: 0,
	y: 0
};
var readyForShape = false;
var shapeType = "rectangle";
var shapePos = {
	x: 0,
	y: 0
};
var shapeEndPos = {
	x: 0,
	y: 0
};
var rainbowPointer = 0;
var rainbowSpeed = 1;
var gradientSwitch = false;
var messageCounter = 0;
var userJoinCounter = 0;
var canvasRect = canvas.getBoundingClientRect();

function setShapeType(ele, shape) {
	document.getElementById('shapeRect').className = "button tool";
	document.getElementById('shapeCircle').className = "button tool";
	ele.className = "button bselect tool";
	shapeType = shape;
}

function sendChatMessage() {
	var data = {
		name: name,
		message: document.getElementById('chat-message').value
	}
	if(data.message.length > 0) {
		document.getElementById('chat-message').value = "";
		addChatMessage(data);
		socket.emit('chat message', data);
	}
}

document.getElementById('chat-message').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
     	sendChatMessage();
      	return false;
    }
}

document.getElementById('name').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
     	sync();
      	return false;
    }
}

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
	webGLStart();
	getNameList();
}

function getNameList() {
	var txtFile = new XMLHttpRequest();
	txtFile.open("GET", "/files/names.txt", true);
	txtFile.onreadystatechange = function() {
		if (txtFile.readyState === 4) {  // document is ready to parse.
		    if (txtFile.status === 200) {  // file is found
		      	allText = txtFile.responseText; 
		      	lines = txtFile.responseText.split("\n");
		      	randomNames = lines;
		      	setNameTextBox();
		    }
		}
	}
	txtFile.send(null);
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
	var tbody = table.getElementsByTagName('tbody')[0]
	var row = tbody.rows;
	var roomSearch = document.getElementById('room-search');
	for(var i = 0; i < row.length; i++) {
		row[i].className = "";
		if(roomSearch.value != "") {
			if(row[i].cells[0].innerHTML.indexOf(roomSearch.value) == -1) {
				 row[i].className = "invisible";
			}
		}
	}
}

socket.on('cannot create room', function(data) {
	alert(data);
});

socket.on('room result', function(data) {
	insertURLParam("room", data);
});

function sync() {
	if(hasSynced === false) {
		name = document.getElementById('name').value;
		var me = {
			id: getURLParam('room'),
			name : name,
			colour: tool.brush.colour
		}
		socket.emit('join room', getURLParam('room'));
		socket.emit('im online', me);
	}
}

socket.on('name taken', function() {
	document.getElementById('name-taken').className = "";
});

socket.on('user validated', function() {
	document.getElementById('name-content').className = "invisible";
	document.getElementById('name-taken').className = "invisible";
	document.getElementById('currently-syncing').className = "";
	socket.emit('sync');
	// Hide enter name box
});

socket.on('room full', function() {
	document.getElementById('room-full').className = "";
});

socket.on('sync draw', function(data) {
	drawCircle(data.x, data.y, data.lastX, data.lastY, data.size, data.colour);
});

socket.on('sync draw text', function(data) {
	drawText(data.x, data.y, data.font, data.colour, data.text);
});

socket.on('sync draw rect', function(data) {
	drawShapeRect(data.x, data.y, data.endX, data.endY, data.colour);
});

socket.on('sync draw circle', function(data) {
	drawShapeCircle(data.x, data.y, data.endX, data.endY, data.colour);
});

socket.on('sync draw line', function(data) {
	drawShapeLine(data.x, data.y, data.endX, data.endY, data.colour, data.size, data.lineTip);
});

socket.on('sync erase', function(data) {
	drawRect(data.x, data.y, data.lastX, data.lastY, data.size, "white");
});

socket.on('sync result', function(data) {
	document.getElementById('name-wrap').className = "invisible";
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
		var ele = document.getElementById('users-online-tab');
		if(ele.className != "tab selected") {
			userJoinCounter++;
			ele.innerHTML = '<a>Users Online</a>' +
					'<div class="orange-notification">' +
							userJoinCounter +
					'</div>';
		} else {
			userJoinCounter = 0;
		}
	}
});

socket.on('sync user colour', function(data) {
	if(data.length != 0) {
		for(var i = 0; i < data.length; i++) {
			var user;
			if(data[i].name === name) {
				user = document.getElementById(data[i].name + " (you)");
				if(user != null) {
					user.innerHTML = '<div class="user-colour" style="background-color:' + data[i].colour + '"></div>' +
								 '<div class="user-name">' + data[i].name + ' (you)</div>';
				}
			} else {
				user = document.getElementById(data[i].name);
				if(user != null) {
					user.innerHTML = '<div class="user-colour" style="background-color:' + data[i].colour + '"></div>' +
							     	'<div class="user-name">' + data[i].name + '</div>';
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

socket.on('sync chat message', function(data) {
	addChatMessage(data);
	var ele = document.getElementById('users-chat-tab');
	if(ele.className != "tab selected") {
		messageCounter++;
		ele.innerHTML = '<a>Chat</a>' +
				'<div class="orange-notification">' +
						messageCounter +
				'</div>';
	} else {
		messageCounter = 0;
	}
});
socket.on('canvas saved', function(data) {
	cSavedTimer = new Date().getTime();
	document.getElementById('save-complete').className = "";
	document.getElementById('save-progress').className = "invisible";
	setTimeout(function() {
		document.getElementById('save-wrap').className ="invisible";
		document.getElementById('save-complete').className = "invisible";
		document.getElementById('save-progress').className = "";
		currentlySaving = false;
	}, 1500)
});

function clearChatNotifs() {
	messageCounter = 0;
	document.getElementById('users-chat-tab').innerHTML = '<a>Chat</a>';
}

function clearUserCounter() {
	userJoinCounter = 0;
	document.getElementById('users-online-tab').innerHTML = '<a>Users Online</a>';
}

function addChatMessage(data) {
	var chat = document.getElementById('chat-box');
	var theName = data.name;
	if(data.name === name) {
		theName = "You";
	}
	var newMesage = '<div class="chat-row">' +
						'<div class="name" style="font-weight: bold;">' + theName + ': ' + '</div>' +
						'<div class="message"><p>' + data.message + '</p></div>' +
					'</div>';
	chat.innerHTML += newMesage;
	chat.scrollTop = chat.scrollHeight;
}

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
	var outSize = tool.brush.size / 2;
	if(outSize <= 1.5) {
		outSize = 1.5;
	}
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.lineWidth = 1;
	pointerContext.lineCap = "round";
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'white';
    pointerContext.arc(x - cr.left, y - cr.top, Math.abs(outSize + 1) ,0,2*Math.PI);
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'black';
    pointerContext.arc(x - cr.left, y - cr.top, Math.abs(outSize),0,2*Math.PI);
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.strokeStyle = 'white';
    pointerContext.arc(x - cr.left, y - cr.top, Math.abs(outSize - 1),0,2*Math.PI);
    pointerContext.stroke();
}

function drawEraserOutline(x, y) {
	var cr = pointerCanvas.getBoundingClientRect();
	var outSize = tool.brush.size / 2;
	if(outSize <= 1.5) {
		outSize = 1.5;
	}
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.lineWidth = 1;
	pointerContext.lineCap = "round";
	pointerContext.beginPath();
    pointerContext.rect(x - cr.left - outSize - 1, y - cr.top - outSize - 1, outSize * 2 + 2, outSize * 2 + 2);
    pointerContext.strokeStyle = 'white';
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.rect(x - cr.left - outSize, y - cr.top - outSize, outSize * 2, outSize * 2);
    pointerContext.strokeStyle = 'black';
    pointerContext.stroke();
    pointerContext.beginPath();
    pointerContext.rect(x - cr.left - outSize + 1, y - cr.top - outSize + 1, outSize * 2 - 2, outSize * 2 - 2);
    pointerContext.strokeStyle = 'white';
    pointerContext.stroke();
}

function draw() {
	if(currentlyVoting === false && currentlySaving === false) {
		canvasRect = canvas.getBoundingClientRect();
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: tool.brush.size,
			colour: tool.brush.colour
		}
		drawCircle(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
		socket.emit('draw', json);
	}
}

function erase() {
	if(currentlyVoting === false && currentlySaving === false) {
		canvasRect = canvas.getBoundingClientRect();
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: tool.brush.size,
			colour: tool.brush.colour
		}
		drawRect(json.x, json.y, json.lastX, json.lastY, json.size, "white");
		socket.emit('erase', json);
	}
}

function gradientDraw(timer) {
	if(currentlyVoting === false && currentlySaving === false) {
		canvasRect = canvas.getBoundingClientRect();
		var rgb = convertHexToRGB(tool.brush.colour);
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
			size: tool.brush.size,
			colour: hex
		}
		drawCircle(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
		socket.emit('draw', json);
	}
}

function rainbowDraw() {
	if(currentlyVoting === false && currentlySaving === false) {
		canvasRect = canvas.getBoundingClientRect();
		var rgb = convertHexToRGB(tool.brush.colour);
		huePointer = {
			x: 0,
			y: rainbowPointer
		}
		var rgba = getColourOnHueCanvas();
		var hex = convertRGBToHex(rgba.r, rgba.g, rgba.b);
		var json = {
			name: name,
			x: mousePos.x - canvasRect.left,
			y: mousePos.y - canvasRect.top,
			lastX: lastPos.x - canvasRect.left,
			lastY: lastPos.y - canvasRect.top,
			size: tool.brush.size,
			colour: hex
		}
		drawCircle(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
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
    for (var i = 0; i < dist; i+=1) {
	    x = lastP.x + (Math.sin(angle) * i);
	    y = lastP.y + (Math.cos(angle) * i);
	    context.fillStyle = colour;
		context.fillRect(x - size / 2, y - size / 2, size, size);
    }
}

function drawCircle(curX, curY, lastX, lastY, size, colour) {
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
    for (var i = 0; i < dist; i+=1) {
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
		colour: tool.brush.colour
	};
	if(connectedUsers <= 1) {
		me.canvas = canvas.toDataURL();
		socket.emit('im offline store canvas', me);	
	} else {
		socket.emit('im offline', me);	
	}
});

function saveRoom() {
	if(hasSynced === true) {
		currentlySaving = true;
		document.getElementById('save-wrap').className = "table-visible";
		document.getElementById('save-progress').className = "";
		var me = {
			canvas: canvas.toDataURL()
		};
		socket.emit('store canvas', me);
	}
}

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

speedSelection.addEventListener("input", function(evt){
	rainbowSpeed = parseInt(this.value);
	tool.brush.gradientSpeed = parseInt(this.value);
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
	drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
}

function changeLineTip() {
	var e = document.getElementById("lineTip");
	tool.brush.lineTip = e.options[e.selectedIndex].value;
}

function changeTextSize(newSize){
	var e = document.getElementById("fontSel");
	var font = e.options[e.selectedIndex].value;
	textFont = newSize + "px " + font;
	drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
}

function brushSize(newSize){
	tool.brush.size = parseInt(newSize);
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
	tool.brush.setColour(hex);
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

function drawTempRect(x, y, endX, endY) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
    pointerContext.fillStyle = tool.brush.colour;
	pointerContext.fillRect(x - cr.left, y - cr.top, (endX - x), (endY - y));
}

function drawShapeRect(x, y, endX, endY, colour) {
    context.fillStyle = colour;
	context.fillRect(x, y, (endX - x), (endY - y));
}

function drawTempCircle(x, y, endX, endY, colour) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.beginPath();
	var radius = 0;
	if(Math.abs((endX - x)) > Math.abs((endY - y))) {
		radius = Math.abs((endX - x));
	} else {
		radius = Math.abs((endY - y));
	}
	pointerContext.arc(x - cr.left, y - cr.top, radius, 0, 2 * Math.PI, false);
	pointerContext.fillStyle = colour;
	pointerContext.fill();
}

function drawShapeCircle(x, y, endX, endY, colour) {
	context.beginPath();
	var radius = 0;
	if(Math.abs((endX - x)) > Math.abs((endY - y))) {
		radius = Math.abs((endX - x));
	} else {
		radius = Math.abs((endY - y));
	}
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = colour;
	context.fill();
}

function drawTempLine(x, y, endX, endY, colour, size, lineTip) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.strokeStyle = colour;
	pointerContext.lineWidth = size;
	pointerContext.lineCap = tool.brush.lineTip;
	pointerContext.beginPath();
	pointerContext.moveTo(x - cr.left, y - cr.top);
	pointerContext.lineTo(endX - cr.left,endY - cr.top);
	pointerContext.stroke();
}

function drawShapeLine(x, y, endX, endY, colour, size, lineTip) {
	context.strokeStyle = colour;
	context.lineWidth = size;
	context.lineCap = tool.brush.lineTip;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(endX,endY);
	context.stroke();
}


function applyText() {
	if(readyForText == true) {
		var cr = canvas.getBoundingClientRect();
		var data = {
			x: textPos.x - cr.left,
			y: textPos.y - cr.top,
			font: textFont,
			colour: tool.brush.colour,
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
	if(tool.brush.brushType === "freeroam" || tool.brush.brushType === "gradient-brush" || tool.brush.brushType === "rainbow-brush") {
		drawBrushOutline(mousePos.x, mousePos.y);
	} else if(tool.brush.brushType === "eraser"){
		drawEraserOutline(mousePos.x, mousePos.y);
	}
	if(mouseDown === true) {
		if(hasSynced === true) {
			if(tool.brush.getBrushType() === "freeroam") {
				if(canDraw === true) {
					draw();
				}	
			} else if(tool.brush.getBrushType() === "gradient-brush") {
				if(canDraw === true) {
					if(tool.brush.gradientTimer >= 255) {
						gradientSwitch = true;
					} else if(tool.brush.gradientTimer <= 0) {
						gradientSwitch = false;
					}

					if(gradientSwitch === true) {
						tool.brush.gradientTimer -= tool.brush.gradientSpeed;
					} else {
						tool.brush.gradientTimer += tool.brush.gradientSpeed;
					}

					gradientDraw(tool.brush.gradientTimer);
				}	
			}  else if(tool.brush.brushType === "rainbow-brush") {
		    	if(canDraw === true) {
		    		rainbowPointer+=rainbowSpeed;
		    		if(rainbowPointer >= 255) {
		    			rainbowPointer = 0;
		    		}
		    		rainbowDraw();
    			}
			} else if(tool.brush.brushType === "dropper"){
		    	if(mouseIsHoveringCanvas(canvas)) {
		    		if(currentlyVoting === false && currentlySaving === false) {
	    				var rgb = getColourOnCanvas(canvas, context);
						onColourChange(rgb);
					}
				}
			} else if(tool.brush.brushType === "eraser"){
		    	if(canDraw === true) {
		    		erase();
				}
			} else if(tool.brush.brushType === "text"){
		    	if(canDraw === true) {
		    		textPos = mousePos;
				}
				drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
			} else if(tool.brush.brushType === "shape"){
		    	if(canDraw === true) {
		    		if(readyForShape === true) {
		    			if(currentlyVoting === false && currentlySaving === false) {
			    			shapeEndPos = mousePos;
			    			if(shapeType === "rectangle") {
			    				drawTempRect(shapePos.x, shapePos.y, shapeEndPos.x, shapeEndPos.y, tool.brush.colour);
			    			} else if(shapeType === "circle") {
			    				drawTempCircle(shapePos.x, shapePos.y, shapeEndPos.x, shapeEndPos.y, tool.brush.colour);
			    			}
		    			}
		    		}
				}
			} else if(tool.brush.brushType === "line"){
			    if(canDraw === true) {
			    	if(readyForShape === true) {
			    		if(currentlyVoting === false && currentlySaving === false) {
			    			shapeEndPos = mousePos;
			    			drawTempLine(shapePos.x, shapePos.y, shapeEndPos.x, shapeEndPos.y, tool.brush.colour, tool.brush.size, tool.brush.lineTip);
			    		}
			    	}
				}
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
    		if(hasSynced === true) {
    			// Located in colour-picker2.js
	    		if(canMoveTintPointer === false) {
			        if(mouseIsHoveringCanvas(tintCanvas)) {
			            canMoveTintPointer = true;
			            canDraw = false;
			        }  else if(mouseIsHoveringCanvas(hueCanvas)) {
			        	canMoveHuePointer = true;
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
			    if(tool.brush.brushType === "freeroam") {
			    	if(canDraw === true) {
			    		draw();
			    	}
			    } else if(tool.brush.brushType === "gradient-brush") {
			    	if(canDraw === true) {
			    		tool.brush.gradientTimer = 0;
			    		gradientDraw(tool.brush.gradientTimer);
	    			}
			    } else if(tool.brush.brushType === "rainbow-brush") {
			    	if(canDraw === true) {
			    		rainbowDraw();
	    			}
			    } else if(tool.brush.brushType === "dropper"){
			    	if(mouseIsHoveringCanvas(canvas)) {
			    		if(currentlyVoting === false && currentlySaving === false) {
		    				var rgb = getColourOnCanvas(canvas, context);
							onColourChange(rgb);
						}
					}
				} else if(tool.brush.brushType === "text"){
			    	if(canDraw === true) {
			    		if(currentlyVoting === false && currentlySaving === false) {
				    		readyForText = true;
				    		textPos = mousePos;
			    		}
					}
					drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
				} else if(tool.brush.brushType === "shape"){
			    	if(canDraw === true) {
			    		if(readyForShape === false) {
			    			if(currentlyVoting === false && currentlySaving === false) {
				    			readyForShape = true;
				    			shapePos = mousePos;
			    			}
			    		}
					}
				} else if(tool.brush.brushType === "line"){
			    	if(canDraw === true) {
			    		if(readyForShape === false) {
			    			if(currentlyVoting === false && currentlySaving === false) {
				    			readyForShape = true;
				    			shapePos = mousePos;
				    		}
			    		}
					}
				} else if(tool.brush.brushType === "eraser"){
			    	if(canDraw === true) {
		    			erase();
					}
				} else if(tool.brush.brushType === "fillBucket") {
					fillBucket(context, tool.brush.colour);
					tool.brush.setBrushType("freeroam");
				}
    		}
    	}
	}
});
document.addEventListener("mouseup", function(evt) {
	canvas.className = ""; // Reverts to no classname
	if(evt.button === 0) {
    	mouseDown = false;
    	if(readyForShape === true) {
    		pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
    		canvasRect = canvas.getBoundingClientRect();
    		if(tool.brush.brushType === "shape"){
    			if(currentlyVoting === false && currentlySaving === false) {
		    		var shapeData = {
		    			x: shapePos.x - canvasRect.left,
		    			y: shapePos.y - canvasRect.top,
		    			endX: shapeEndPos.x - canvasRect.left,
		    			endY: shapeEndPos.y - canvasRect.top,
		    			colour: tool.brush.colour
		    		}
		    		if(shapeType === "rectangle") {
			    		drawShapeRect(shapeData.x, shapeData.y, shapeData.endX, shapeData.endY, shapeData.colour);
			    		socket.emit('draw rect', shapeData);
		    		} else if(shapeType === "circle") {
			    		drawShapeCircle(shapeData.x, shapeData.y, shapeData.endX, shapeData.endY, shapeData.colour);
			    		socket.emit('draw circle', shapeData);
	    			}
    			}
    		} else if(tool.brush.brushType === "line") {
  				if(currentlyVoting === false && currentlySaving === false) {
	    			var lineData = {
		    			x: shapePos.x - canvasRect.left,
		    			y: shapePos.y - canvasRect.top,
		    			endX: shapeEndPos.x - canvasRect.left,
		    			endY: shapeEndPos.y - canvasRect.top,
		    			lineTip: tool.brush.lineTip,
		    			size: tool.brush.size,
		    			colour: tool.brush.colour
		    		};
			    	drawShapeLine(lineData.x, lineData.y, lineData.endX, lineData.endY, lineData.colour, lineData.size, lineData.lineTip);
			    	socket.emit('draw line', lineData);
		    	}
    		}
    		readyForShape = false;
    	}
    	readyForShape = false;
	    // Located in colour-picker2.js
	    if(canMoveTintPointer === true) {
	        canMoveTintPointer = false;
	    }

	    if(canMoveHuePointer === true) {
	    	canMoveHuePointer = false;
	    }

    	if(canDraw === true) {
			canDraw = false;
		}
	}
});

document.body.addEventListener("keydown", function(e) {
	if(readyForText === true) {
		if(currentlyVoting === false && currentlySaving === false) {
			textToRender = document.getElementById('text-tool-text').value;	
			drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
			document.getElementById('text-tool-text').focus();
			if(e.keyCode == 13) {
		    	applyText();
		    }
		}
	}
});
 
document.body.addEventListener("keyup", function(e) {
	if(readyForText === true) {
		if(currentlyVoting === false && currentlySaving === false) {
			textToRender = document.getElementById('text-tool-text').value;	
			drawTempText(textPos.x, textPos.y, textFont, tool.brush.colour, textToRender);
		}
	}
});

document.getElementById('clearCanvas').addEventListener('click', function(evt){
	clearCanvas();
})

document.getElementById('brush').addEventListener('click', function(evt){
	tool.brush.setBrushType('freeroam');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
});

document.getElementById('colourDrop').addEventListener('click', function(evt){
	tool.brush.setBrushType('dropper');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('pointer-canvas').style.cursor = "crosshair";
	document.getElementById('dropper-settings').className = "";
});

document.getElementById('gradient-brush').addEventListener('click', function(evt){
	tool.brush.setBrushType('gradient-brush');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
	document.getElementById('rainbow-settings').className = "inline-block";
});

document.getElementById('rainbow-brush').addEventListener('click', function(evt){
	tool.brush.setBrushType('rainbow-brush');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('brush-settings').className = "";
	document.getElementById('rainbow-settings').className = "inline-block";
});

document.getElementById('saveCanvas').addEventListener('click', function(evt){
	window.open(canvas.toDataURL());
});

document.getElementById('text-tool').addEventListener('click', function(evt){
	tool.brush.setBrushType('text');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('canvas').style.cursor = "text";
	document.getElementById('pointer-canvas').style.cursor = "text";
	document.getElementById('text-settings').className = "";
});

document.getElementById('shape-tool').addEventListener('click', function(evt){
	tool.brush.setBrushType('shape');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('canvas').style.cursor = "pointer";
	document.getElementById('pointer-canvas').style.cursor = "pointer";
	document.getElementById('shape-settings').className = "";
});

document.getElementById('line-tool').addEventListener('click', function(evt){
	tool.brush.setBrushType('line');
	resetTools();
	this.className = "button bselect tool";
	document.getElementById('canvas').style.cursor = "pointer";
	document.getElementById('pointer-canvas').style.cursor = "pointer";
	document.getElementById('brush-settings').className = "";
	document.getElementById('line-settings').className = "inline-block";
});

document.getElementById('eraser').addEventListener('click', function(evt){
	tool.brush.setBrushType('eraser');
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
	document.getElementById('rainbow-brush').className = "button tool";
	document.getElementById('text-tool').className = "button tool";
	document.getElementById('shape-tool').className = "button tool";
	document.getElementById('line-tool').className = "button tool";
	document.getElementById('eraser').className = "button tool";
	// Tool Settings
	document.getElementById('brush-settings').className = "invisible";
	document.getElementById('rainbow-settings').className = "invisible";
	document.getElementById('dropper-settings').className = "invisible";
	document.getElementById('text-settings').className = "invisible";
	document.getElementById('shape-settings').className = "invisible";
	document.getElementById('line-settings').className = "invisible";
	// Canvases
	document.getElementById('canvas').style.cursor = "none";
	document.getElementById('pointer-canvas').style.cursor = "none";
}

/*document.getElementById('fillBucket').addEventListener('click', function(evt){
	tool.brush.setBrushType('fillBucket');
});
*/