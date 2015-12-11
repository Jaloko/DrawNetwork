var ShapeTool = function(){
	this.shapeType = "rectangle",
	this.sizingReady = false,
	this.readyToDraw = false,
	this.shapePos = {
		x: 0,
		y: 0
	},
	this.shapeEndPos = {
		x: 0,
		y: 0
	}
};

ShapeTool.prototype.getShapeType = function(){
	return this.shapeType;
};

ShapeTool.prototype.setShapeType = function(ele, shape) {
	// Need to update this later
	document.getElementById('shapeRect').className = "button tool";
	document.getElementById('shapeCircle').className = "button tool";
	ele.className = "button bselect tool";
	this.shapeType = shape;
};


// Draw Rectangle Methods
ShapeTool.prototype.drawRect = function(curX, curY, lastX, lastY, size, colour) {
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
};

ShapeTool.prototype.drawTempRect = function(x, y, endX, endY) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.fillStyle = tool.brush.colour;
	pointerContext.fillRect(x - cr.left, y - cr.top, (endX - x), (endY - y));
};

ShapeTool.prototype.drawShapeRect = function(x, y, endX, endY, colour) {
	context.fillStyle = colour;
	context.fillRect(x, y, (endX - x), (endY - y));
};

// Draw Cirle Methods
ShapeTool.prototype.drawCircle = function(curX, curY, lastX, lastY, size, colour) {
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
};

ShapeTool.prototype.drawTempCircle = function(x, y, endX, endY, colour) {
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
};

ShapeTool.prototype.drawShapeCircle = function(x, y, endX, endY, colour) {
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
};


ShapeTool.prototype.drawTempRegularPolygon = function(numberOfVertices, x, y, endX, endY, colour) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	var dist = 0;
	if(Math.abs((endX - x)) > Math.abs((endY - y))) {
		dist = Math.abs((endX - x));
	} else {
		dist = Math.abs((endY - y));
	}

	pointerContext.fillStyle = colour;
	pointerContext.beginPath();
	for(var i = 0; i < numberOfVertices; i++) {
		pointerContext.lineTo( (x - cr.left) - Math.sin(i/numberOfVertices*2*Math.PI) * dist, (y - cr.top) - Math.cos(i/numberOfVertices*2*Math.PI) * dist);
	}
	pointerContext.closePath();
	pointerContext.fill();
};

ShapeTool.prototype.drawShapeRegularPolygon = function(numberOfVertices, x, y, endX, endY, colour) {
	var dist = 0;
	if(Math.abs((endX - x)) > Math.abs((endY - y))) {
		dist = Math.abs((endX - x));
	} else {
		dist = Math.abs((endY - y));
	}

	context.fillStyle = colour;
	context.beginPath();
	for(var i = 0; i < numberOfVertices; i++) {
		context.lineTo( (x) - Math.sin(i/numberOfVertices*2*Math.PI) * dist, (y) - Math.cos(i/numberOfVertices*2*Math.PI) * dist);
	}
	context.closePath();
	context.fill();
};

ShapeTool.prototype.drawTemp = function() {
	switch(this.getShapeType()) {
		case ShapeTypes.RECTANGLE:
			this.drawTempRect(this.shapePos.x, this.shapePos.y, this.shapeEndPos.x, this.shapeEndPos.y, tool.brush.colour);
			break;
		case ShapeTypes.CIRCLE:
			this.drawTempCircle(this.shapePos.x, this.shapePos.y, this.shapeEndPos.x, this.shapeEndPos.y, tool.brush.colour);
			break;
		case ShapeTypes.PENTAGON:
			this.drawTempRegularPolygon(5, this.shapePos.x, this.shapePos.y, this.shapeEndPos.x, this.shapeEndPos.y, tool.brush.colour);
			break;
		case ShapeTypes.HEXAGON:
			this.drawTempRegularPolygon(6, this.shapePos.x, this.shapePos.y, this.shapeEndPos.x, this.shapeEndPos.y, tool.brush.colour);
			break;
	}
};

ShapeTool.prototype.draw = function(shapeData) {
	switch(this.getShapeType()) {
		case ShapeTypes.RECTANGLE:
			this.drawShapeRect(shapeData['x'], shapeData['y'], shapeData['endX'], shapeData['endY'], shapeData['colour']);
			socket.emit('draw rect', shapeData);
			break;
		case ShapeTypes.CIRCLE:
			this.drawShapeCircle(shapeData['x'], shapeData['y'], shapeData['endX'], shapeData['endY'], shapeData['colour']);
			socket.emit('draw circle', shapeData);
			break;
		case ShapeTypes.PENTAGON:
			this.drawShapeRegularPolygon(5, shapeData['x'], shapeData['y'], shapeData['endX'], shapeData['endY'], shapeData['colour']);
			socket.emit('draw pentagon', shapeData);
			break;
		case ShapeTypes.HEXAGON:
			this.drawShapeRegularPolygon(6, shapeData['x'], shapeData['y'], shapeData['endX'], shapeData['endY'], shapeData['colour']);
			socket.emit('draw hexagon', shapeData);
			break;
	}
	this.sizingReady = false;
};

var ShapeTypes = {
	RECTANGLE: "rectangle",
	CIRCLE: "circle",
	PENTAGON: "pentagon",
	HEXAGON: "hexagon"
};