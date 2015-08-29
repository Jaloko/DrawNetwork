var ShapeTool = function(){
	this.shapeType = "rectangle",

	this.getShapeType = function(){
		return this.shapeType;
	}

	this.setShapeType = function(ele, shape) {
		document.getElementById('shapeRect').className = "button tool";
		document.getElementById('shapeCircle').className = "button tool";
		ele.className = "button bselect tool";
		shapeType = shape;
	}


	// Draw Rectangle Methods
	this.drawRect = function(curX, curY, lastX, lastY, size, colour) {
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

	this.drawTempRect = function(x, y, endX, endY) {
		var cr = pointerCanvas.getBoundingClientRect();
		pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
    	pointerContext.fillStyle = tool.brush.colour;
		pointerContext.fillRect(x - cr.left, y - cr.top, (endX - x), (endY - y));
	}
	
	this.drawShapeRect = function(x, y, endX, endY, colour) {
    	context.fillStyle = colour;
		context.fillRect(x, y, (endX - x), (endY - y));
	}

	// Draw Cirle Methods
	this.drawCircle = function(curX, curY, lastX, lastY, size, colour) {
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

	this.drawTempCircle = function(x, y, endX, endY, colour) {
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
	
	this.drawShapeCircle = function(x, y, endX, endY, colour) {
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
};