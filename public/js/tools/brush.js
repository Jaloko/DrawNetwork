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
	},

	this.getBrushType = function(){
		return this.brushType;
	}

	this.setColour = function(newColour){
		this.colour = newColour;
	}

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
};