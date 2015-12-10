var TextTool = function(){
	this.textToRender = "",
	this.textFont = "20px Arial"
};


TextTool.prototype.drawText = function(x, y, font, colour, text) {
	context.font=font;
	context.fillStyle = colour;
	context.fillText(text,x,y) ;
};


TextTool.prototype.drawTempText = function(x, y, font, colour, text) {
	var cr = pointerCanvas.getBoundingClientRect();
	pointerContext.clearRect ( 0 , 0 , pointerCanvas.width, pointerCanvas.height );
	pointerContext.font=font;
	pointerContext.fillStyle = colour;
	pointerContext.fillText(text,x - cr.left ,y - cr.top);
};

TextTool.prototype.changeFont = function() {
	var e = document.getElementById("fontSel");
	var font = e.options[e.selectedIndex].value;
	var split = tool.textTool.textFont.split(" ");
	this.textFont = split[0] + " " + font;
	this.drawTempText(textPos.x, textPos.y, tool.textTool.textFont, tool.brush.colour, tool.textTool.textToRender);
};

TextTool.prototype.changeTextSize = function(newSize){
	var e = document.getElementById("fontSel");
	var font = e.options[e.selectedIndex].value;
	this.textFont = newSize + "px " + font;
	this.drawTempText(textPos.x, textPos.y, tool.textTool.textFont, tool.brush.colour, tool.textTool.textToRender);
};