// Danni Dickson
var img = new Image();
var colCanvas = document.getElementById("color-picker");
var colContext = colCanvas.getContext('2d');
colCanvas.width = 260;
colCanvas.height = 260;

var colourRGBArray = {
	'r':0,
	'g':0,
	'b':0
};

var rgbInputs = {
	'r': document.getElementById('rColrVal'),
	'g': document.getElementById('gColrVal'),
	'b':document.getElementById('bColrVal'),
	'hex': document.getElementById('hexVal'),
	'selected' : document.getElementById('selectedVal')
};

// load image into canvas

img.onload = function () {
	colContext.drawImage(this, 0, 0);
};

img.src = "img/color_picker.png";

colCanvas.addEventListener('mousemove', function(evt) {
	// Gets the position of the canvas
	var canvasRect = colCanvas.getBoundingClientRect();
	var mouseX = evt.clientX;
	var mouseY = evt.clientY;
	
	var x = mouseX - canvasRect.left;
	var y = mouseY - canvasRect.top;

	var data = colContext.getImageData(x, y, 1,1);
	var pixels = data.data;

	colourRGBArray.r = pixels[0];
	colourRGBArray.g = pixels[1];
	colourRGBArray.b = pixels[2];

	var hex = convertRGBToHex(colourRGBArray.r, colourRGBArray.g, colourRGBArray.b);
	assignRGBToDom(colourRGBArray.r, colourRGBArray.g, colourRGBArray.b, hex);

}, false);

colCanvas.addEventListener('mousedown', function(evt){
	var hex = assignSelectedHexColour();
	brush.setColour(hex);
});


function assignSelectedHexColour(){
	rgbInputs.selected.value = rgbInputs.hex.value;
	return rgbInputs.selected.value;
}

function assignRGBToDom(red, green, blue, hex){
	// console.log("R:" + colourRGBArray.r + " G: " + colourRGBArray.g + " B: " + colourRGBArray.b);
	rgbInputs.r.value = red;
	rgbInputs.g.value = green;
	rgbInputs.b.value = blue;
	rgbInputs.hex.value = hex;
}

function convertRGBToHex(red, green, blue){
	var r = red.toString(16);
	var g = green.toString(16);
	var b = blue.toString(16);

	return "#" + binaryResult(r) + binaryResult(g) + binaryResult(b);
}

function binaryResult(col){
	return col.length === 1 ? "0" + col : col;
}