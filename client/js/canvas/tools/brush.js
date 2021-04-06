/*--------------------------------------------
	Brush
	This object contains methods for
	all brush related functions

	- Standard Brush
	- Gradient Brush
	- Rainbow Brush
	- Line Tool
	- Eraser
--------------------------------------------*/
import { socket, tool, client, pointerCanvas, pointerContext, context } from "../variables";
import Input from "../input";
import Util from "../util";
import { Position, ColourPicker } from "../colour-picker";

let Brush = function(){
	this.size = 30,
	this.colour = "#ff0000",
	this.brushType = "freeroam",
	this.lineTip = "round",

	// Gradient related

	this.gradientTimer = 0,
	this.gradientSpeed = 1,
	this.gradientSwitch = false,

	// Rainbow vars
	this.rainbowPointer = 0,
	this.rainbowSpeed = 1
};



/*--------------------------------------------
	Setters and Getters
--------------------------------------------*/
Brush.prototype.setBrushType = function(type){
	this.brushType = type;
};

Brush.prototype.getBrushType = function(){
	return this.brushType;
};

Brush.prototype.setBrushSize = function(input){
	this.size = input;

};

Brush.prototype.getBrushSize = function(){
	return this.size;
};

Brush.prototype.setColour = function(newColour){
	this.colour = newColour;
};

/*--------------------------------------------
	Outlines for brush and eraser
	Displays a grey outline on the canvas
--------------------------------------------*/
Brush.prototype.drawBrushOutline = function(x, y) {
	var cr = pointerCanvas.getBoundingClientRect();
	var outSize = this.size / 2;
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
};

Brush.prototype.drawEraserOutline = function(x, y) {
	var cr = pointerCanvas.getBoundingClientRect();
	var outSize = this.size / 2;
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
};

/*--------------------------------------------
	Gradient Draw
--------------------------------------------*/
Brush.prototype.gradientDraw = function() {
	let canvasRect = canvas.getBoundingClientRect();
	var rgb = Util.hexToRgb(tool.brush.colour);
	rgb.r -= this.gradientTimer;
	rgb.g -= this.gradientTimer;
	rgb.b -= this.gradientTimer;
	if(rgb.r <= 0) {
		rgb.r = 0;
	}
	if(rgb.g <= 0) {
		rgb.g = 0;
	}

	if(rgb.b <= 0) {
		rgb.b = 0;
	}
	var hex = Util.rgbToHex(rgb);
	var json = {
		'name': client.name,
		'x': Input.mousePos.x - canvasRect.left,
		'y': Input.mousePos.y - canvasRect.top,
		'lastX': Input.lastPos.x - canvasRect.left,
		'lastY': Input.lastPos.y - canvasRect.top,
		'size': tool.brush.size,
		'colour': hex
	}
	tool.shapeTool.drawCircle(json['x'], json['y'], json['lastX'], json['lastY'], json['size'], json['colour']);
	socket.emit('draw', json);
};

/*--------------------------------------------
	Rainbow Brush		
--------------------------------------------*/
Brush.prototype.rainbowDraw = function() {
	let canvasRect = canvas.getBoundingClientRect();
	var rgb = Util.hexToRgb(tool.brush.colour);
	ColourPicker.huePosition = new Position(0, this.rainbowPointer);
	var rgb = ColourPicker.getColourOnHueCanvas(ColourPicker.getHueContext(), ColourPicker.huePosition);
	var hex = Util.rgbToHex(rgb);
	var json = {
		'name': client.name,
		'x': Input.mousePos.x - canvasRect.left,
		'y': Input.mousePos.y - canvasRect.top,
		'lastX': Input.lastPos.x - canvasRect.left,
		'lastY': Input.lastPos.y - canvasRect.top,
		'size': this.size,
		'colour': hex
	}
	tool.shapeTool.drawCircle(json['x'], json['y'], json['lastX'], json['lastY'], json['size'], json['colour']);
	socket.emit('draw', json);
};

/*--------------------------------------------
	Line tool
--------------------------------------------*/
Brush.prototype.drawTempLine = function(x, y, endX, endY, colour, size, lineTip) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.strokeStyle = colour;
	pointerContext.lineWidth = size;
	pointerContext.lineCap = tool.brush.lineTip;
	pointerContext.beginPath();
	pointerContext.moveTo(x - cr.left, y - cr.top);
	pointerContext.lineTo(endX - cr.left,endY - cr.top);
	pointerContext.stroke();
};

Brush.prototype.drawShapeLine = function(x, y, endX, endY, colour, size, lineTip) {
	context.strokeStyle = colour;
	context.lineWidth = size;
	context.lineCap = tool.brush.lineTip;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(endX,endY);
	context.stroke();
};
/*--------------------------------------------
	The draw and erase function
	Both methods check if voting or saving.
	Gets the size of the canvas
	Assigns to JSON and draws the circle
	Then emits
--------------------------------------------*/
Brush.prototype.draw = function() {
	let canvasRect = canvas.getBoundingClientRect();
	var json = {
		'name': client.name,
		'x': Input.mousePos.x - canvasRect.left,
		'y': Input.mousePos.y - canvasRect.top,
		'lastX': Input.lastPos.x - canvasRect.left,
		'lastY': Input.lastPos.y - canvasRect.top,
		'size': tool.brush.size,
		'colour': tool.brush.colour
		}
	tool.shapeTool.drawCircle(json['x'], json['y'], json['lastX'], json['lastY'], json['size'], json['colour']);
	socket.emit('draw', json);
};

Brush.prototype.erase = function() {
	let canvasRect = canvas.getBoundingClientRect();
	var json = {
		'name': client.name,
		'x': Input.mousePos.x - canvasRect.left,
		'y': Input.mousePos.y - canvasRect.top,
		'lastX': Input.lastPos.x - canvasRect.left,
		'lastY': Input.lastPos.y - canvasRect.top,
		'size': tool.brush.size,
		'colour': tool.brush.colour
		}
	tool.shapeTool.drawRect(json['x'], json['y'], json['lastX'], json['lastY'], json['size'], "white");
	socket.emit('erase', json);
};

Brush.prototype.drawSquare = function() {
	let canvasRect = canvas.getBoundingClientRect();
	var json = {
		'name': client.name,
		'x': Input.mousePos.x - canvasRect.left,
		'y': Input.mousePos.y - canvasRect.top,
		'lastX': Input.lastPos.x - canvasRect.left,
		'lastY': Input.lastPos.y - canvasRect.top,
		'size': tool.brush.size,
		'colour': tool.brush.colour
		}
	tool.shapeTool.drawRect(json['x'], json['y'], json['lastX'], json['lastY'], json['size'], json['colour']);
	socket.emit('draw square', json);
};


export default Brush;