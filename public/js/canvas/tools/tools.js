var ToolSet = function(){
	this.brush = new Brush(),
	this.textTool = new TextTool(),
	this.shapeTool = new ShapeTool(),


	this.getBrushType = function(){
		return this.brush.getBrushType();
	}
}