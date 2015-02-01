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
var c = canvas.getContext('2d');
var colour = getRandomColor();
var size = 5;
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

function clearCanvas() {
	c.fillStyle = "white";
    c.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('recieve canvas', canvas.toDataURL());
}

function draw() {
	var json = {
		x: mousePos.x,
		y: mousePos.y,
		lastX: lastPos.x,
		lastY: lastPos.y,
		size: size,
		colour: colour
	}

	drawLine(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
	/*drawRect(json.x, json.y, json.colour);*/
	socket.emit('send message', json);
}

function drawRect(x, y, colour) {
    c.fillStyle = colour;
	c.fillRect(x, y, 15, 15);
}

function drawCircle(x, y, size, colour) {
	//draw a circle
	c.lineTo(x, y);
	c.fillStyle = colour;
	c.beginPath();
	c.arc(x, y, size, 0, Math.PI*2, true); 
	c.closePath();
	c.fill();
}

function drawLine(x, y, lastX, lastY, size, colour) {
	c.strokeStyle = colour;
	c.lineWidth = size;
	c.lineCap = "round";
	c.beginPath();
	c.moveTo(lastX , lastY);
	c.lineTo(x,y);
	c.stroke();
}

socket.on('new message', function(data) {
	drawLine(data.x, data.y, data.lastX, data.lastY, data.size, data.colour);
});

socket.on('sync result', function(data) {
	var img = new Image();
	img.onload = function(){
	  c.drawImage(img,0,0); // Or at whatever offset you like
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
			colour: colour
		}
		socket.emit('im online', me);
	} else {
		socket.emit('im not online');
	}
});	

/**
** Helper Functions
**/

function clearUsers() {
	var users = document.getElementById('users');
	users.innerHTML = "";
}

function addUser(name, colour) {
	var users = document.getElementById('users');
	var newUser = '<div id="' + name +  '" class="row"><div class="colour" style="background-color: ' + colour + ';"></div><div class="name">' + name + '</div></div>';
	users.innerHTML += newUser;
}

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
    	if(size >= 30) {
    		size = 30;
    	} else {
    		size++;
    	}
    } else {
    	if(size <= 1) {
    		size = 1
    	} else {
        	size--;
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
	size = newSize;
}

// Brush Colour Picker

// var colourPicker = document.getElementById("colourPicker");
// colourPicker.addEventListener("click", function(evt){
// 	var value = getOptionSelected(colourPicker);
// 	assignColour(value);
// });

// function assignColour(newColour){
// 	colour = newColour;
// }


// Use with html element select and option. Returns the value of the selected option. Parameter is the select element
function getOptionSelected(selectElement){
	return selectElement.options[selectElement.selectedIndex].value;
}



/**
** Canvas Event Listeners
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
	if(mouseDown == true) {
		if(hasSynced == true) {
			draw();
		}
	}
}, false);

canvas.addEventListener("mousedown", function(evt) {
	canvas.className = "dragged";
	if(evt.button == 0) {
    	mouseDown = true;
	} else {
		colour = getRandomColor();
	}
});
canvas.addEventListener("mouseup", function(evt) {
	canvas.className = ""; // Reverts to no classname
	if(evt.button == 0) {
    	mouseDown = false;
	}
});
