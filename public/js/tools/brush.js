var Brush = function(){
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
	this.rainbowSpeed = 1,





	// Setters and Getters
	this.setBrushType = function(type){
		this.brushType = type;
	}

	this.getBrushType = function(){
		return this.brushType;
	}

	this.setBrushSize = function(input){
		this.size = input;

	}
	this.getBrushSize = function(){
		return this.size;
	}

	this.setColour = function(newColour){
		this.colour = newColour;
	}
	/*--------------------------------------------
		Drawing Methods
	--------------------------------------------*/
	this.drawBrushOutline = function(x, y) {
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
	}

	this.drawEraserOutline = function(x, y) {
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
	}

	this.gradientDraw = function() {
		if(currentlyVoting === false && currentlySaving === false) {
			canvasRect = canvas.getBoundingClientRect();
			var rgb = convertHexToRGB(tool.brush.colour);
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

	this.rainbowDraw = function() {
		if(currentlyVoting === false && currentlySaving === false) {
			canvasRect = canvas.getBoundingClientRect();
			var rgb = convertHexToRGB(tool.brush.colour);
			huePointer = {
				x: 0,
				y: this.rainbowPointer
			}
			var rgba = getColourOnHueCanvas();
			var hex = convertRGBToHex(rgba.r, rgba.g, rgba.b);
			var json = {
				name: name,
				x: mousePos.x - canvasRect.left,
				y: mousePos.y - canvasRect.top,
				lastX: lastPos.x - canvasRect.left,
				lastY: lastPos.y - canvasRect.top,
				size: this.size,
				colour: hex
			}
			drawCircle(json.x, json.y, json.lastX, json.lastY, json.size, json.colour);
			socket.emit('draw', json);
		}
	}

	this.draw = function() {
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

	this.erase = function() {
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

};