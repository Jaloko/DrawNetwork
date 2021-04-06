import Util from "./util";
import Input from "./input";
import { socket, tool } from "./variables";

/* ------------------------------------ 
	Object Definitions
 ------------------------------------ */
var Colour = function(r, g, b) {
	this.r = r,
	this.g = g,
	this.b = b
};

var Position = function(x, y) {
	this.x = x,
	this.y = y
};

/* ------------------------------------ 
	Colour Picker Object Definition
 ------------------------------------ */
var ColourPicker = {
	tintPosition: new Position(0, 0),
	huePosition: new Position(0, 0),
	canMoveTintPointer: false,
	canMoveHuePointer: false,
	colourTimer: new Date().getTime(),
	tintImage: new Image()
}

ColourPicker.tintImage.src = "/images/tint.png";
ColourPicker.tintImage.onload = function() {
	ColourPicker.createTint(ColourPicker.getTintContext(), new Colour(255, 0, 0)); 
};

/* ------------------------------------ 
	Colour Picker Primary Functions
------------------------------------ */
ColourPicker.initColourPicker = function() {
	document.getElementById('colour-picker').style.cursor = "crosshair";
	this.createTint(this.getTintContext(), new Colour(255, 0, 0));
	this.createHue(this.getHueContext());
	this.drawTintPointer(this.getTintPointerContext(), new Position(0, 0));
}

ColourPicker.createTint = function(ctx, colour) {
	ctx.fillStyle = Util.rgbToHex(colour);
	ctx.fillRect(0, 0, 256, 256);
	ctx.fillStyle = Util.rgbToHex(colour);
	ctx.drawImage(this.tintImage, 0, 0);
}

ColourPicker.createHue = function(ctx) {
	for(var x = 0; x <= ctx.canvas.width; x++) {
		for(var y = 0; y <= 255; y++) {
			ctx.fillStyle = Util.rgbToHex(Util.hsvToRgb(1 - (y / 256), 1, 1));
			ctx.fillRect(x, y, x + 1, y + 1);
		}
	}
}

ColourPicker.changeColour = function() {
	if(this.canMoveHuePointer) {
		var hueRect = this.getHueContext().canvas.getBoundingClientRect();
		this.huePosition = new Position(Input.mousePos.x - hueRect.left, Input.mousePos.y - hueRect.top);
		this.enforceHueBounds(this.huePosition);
		this.createTint(this.getTintContext(), this.getColourOnHueCanvas(this.getHueContext(), this.huePosition));

		this.getHueArrows()[0].style.top = this.huePosition.y - 7;
		this.getHueArrows()[1].style.top = this.huePosition.y - 7;
		// Set Colours
		var currentColour = document.getElementById('currentColour');
		currentColour.style.backgroundColor = Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition));
		tool.brush.setColour(Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition)));
	}
	if(this.canMoveTintPointer) {
		var tintRect = this.getTintContext().canvas.getBoundingClientRect();
		this.tintPosition = new Position(Input.mousePos.x - tintRect.left, Input.mousePos.y - tintRect.top);
		this.enforceTintBounds(this.tintPosition);
		this.drawTintPointer(this.getTintPointerContext(), this.tintPosition);
		// Set Colours
		var currentColour = document.getElementById('currentColour');
		currentColour.style.backgroundColor = Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition));
		tool.brush.setColour(Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition)));
	}
	if(new Date().getTime() > this.colourTimer + 200) {
		this.colourTimer = new Date().getTime();
		socket.emit('update colour', tool.brush.colour); 
	}
}

ColourPicker.updateColour = function() {
	var currentColour = document.getElementById('currentColour');
	currentColour.style.backgroundColor = Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition));
	tool.brush.setColour(Util.rgbToHex(this.getColourOnTintCanvas(this.getTintContext(), this.tintPosition)));
	this.getHueArrows()[0].style.top = this.huePosition.y - 7;
	this.getHueArrows()[1].style.top = this.huePosition.y - 7;
	this.createTint(this.getTintContext(), this.getColourOnHueCanvas(this.getHueContext(), this.huePosition));
	this.drawTintPointer(this.getTintPointerContext(), this.tintPosition);
	if(new Date().getTime() > this.colourTimer + 200) {
		this.colourTimer = new Date().getTime();
		socket.emit('update colour', tool.brush.colour); 
	}
}

/* ------------------------------------ 
	Colour Picker Helper Functions
------------------------------------ */
ColourPicker.getTintContext = function() {
	var tint = document.getElementById("tint");
	return tint.getContext("2d");
}

ColourPicker.getHueContext = function() {
	var hue = document.getElementById("hue");
	return hue.getContext("2d");
}

ColourPicker.getTintPointerContext = function() {
	var tintPointer = document.getElementById("tint-pointer");
	return tintPointer.getContext("2d");
}

ColourPicker.getHueArrows = function() {
	return[document.getElementById("hue-arrow-left"),
	document.getElementById("hue-arrow-right")];
}

ColourPicker.drawTintPointer = function(ctx, position) {
	// Draw the colour pointer
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.width);
	ctx.beginPath();
	ctx.strokeStyle = 'white';
	ctx.arc(position.x,position.y,5,0,2*Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.strokeStyle = 'black';
	ctx.arc(position.x,position.y,6,0,2*Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.strokeStyle = 'white';
	ctx.arc(position.x,position.y,7,0,2*Math.PI);
	ctx.stroke();
}

ColourPicker.getColourOnTintCanvas = function(ctx, position) {
	var x = position.x;
	var y = position.y;

	// Make sure within array bounds
	if(x >= 255) x = 255;
	if(y >= 255) y = 255;

	var data = ctx.getImageData(x, y, 1, 1);
	var pixels = data.data;
	var rgba = {
		r: pixels[0],
		g: pixels[1],
		b: pixels[2],
		a: pixels[3]
	};
	return new Colour(rgba.r, rgba.g, rgba.b);
}

ColourPicker.getColourOnHueCanvas = function(ctx, position) {
	var y = position.y;

	// Make sure within array bounds
	if(y >= 255) y = 255;

	var data = ctx.getImageData(0, y, 1, y + 1);
	var pixels = data.data;
	var rgba = {
		r: pixels[0],
		g: pixels[1],
		b: pixels[2],
		a: pixels[3]
	};
	return new Colour(rgba.r, rgba.g, rgba.b);
}

// Moved to Util.getColourOnCanvas()
ColourPicker.getColourOnCanvas = function(canvas, ctx){
	var rect = canvas.getBoundingClientRect();
	var doc = document.documentElement;
	var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
	var x = Input.mousePos.x - rect.left;
	var y = Input.mousePos.y - rect.top;

	var data = ctx.getImageData(x, y, 1, 1);
	var pixels = data.data;
	var rgba = {
		r: pixels[0],
		g: pixels[1],
		b: pixels[2],
		a: pixels[3]
	};
	return rgba;
}

ColourPicker.enforceTintBounds = function(position) {
	var tintRect = this.getTintContext().canvas.getBoundingClientRect();
	var pos = Input.mousePos;
	if(pos.x < tintRect.left && pos.y < tintRect.top) {
		position.x = 0;
		position.y = 0;
	} else if(pos.x >= tintRect.right && pos.y < tintRect.top) {
		position.x = 255;
		position.y = 0;
	} else if(pos.x >= tintRect.right && pos.y >= tintRect.bottom) {
		position.x = 255; 
		position.y = 255;
	} else if(pos.x < tintRect.left && pos.y >= tintRect.bottom) {
		position.x = 0;
		position.y = 255;
	} else if(pos.x < tintRect.left) {
		position.x = 0;
		position.y = pos.y - tintRect.top;
	}  else if(pos.x >= tintRect.right) {
		position.x = 255;
		position.y = pos.y - tintRect.top;
	} else if(pos.y < tintRect.top) {
		position.x = pos.x - tintRect.left;
		position.y = 0; 
	} else if(pos.y >= tintRect.bottom) {
		position.x = pos.x - tintRect.left;
		position.y = 255; 
	}
}

ColourPicker.enforceHueBounds = function(position) {
	var hueRect = this.getHueContext().canvas.getBoundingClientRect();
	var pos = Input.mousePos;
	if((pos.x < hueRect.left && pos.y < hueRect.top) || (pos.x >= hueRect.right && pos.y < hueRect.top)) {
		position.x = 0;
		position.y = 0;
	} else if((pos.x >= hueRect.right && pos.y >= hueRect.bottom) || (pos.x < hueRect.left && pos.y >= hueRect.bottom)) {
		position.x = 0; 
		// Probably should be 255
		position.y = 256;
	} else if(pos.x < hueRect.left || pos.x >= hueRect.right) {
		position.x = 0;
		position.y = pos.y - hueRect.top;
	} else if(pos.y < hueRect.top) {
		position.x = pos.x - hueRect.left;
		position.y = 0; 
	} else if(pos.y >= hueRect.bottom) {
		position.x = pos.x - hueRect.left;
		position.y = 256;  
	}
} 
export {
	Colour,
	Position,
	ColourPicker
}
export default ColourPicker;