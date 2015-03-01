var ToolSet = function(){
	this.brush = new Brush(),
	this.textTool = new TextTool(),


	this.getBrushType = function(){
		return this.brush.getBrushType();
	}
}