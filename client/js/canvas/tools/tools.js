
import Brush from "./brush";
import TextTool from "./text-tool";
import ShapeTool from "./shape-tool";
import Dropper from "./dropper";

var ToolSet = function(){
	this.brush = new Brush(),
	this.textTool = new TextTool(),
	this.shapeTool = new ShapeTool(),
	this.dropper = new Dropper()
};

ToolSet.prototype.getBrushType = function(){
	return this.brush.getBrushType();
};

/*--------------------------------------------
	Update Gradient Brush
--------------------------------------------*/
ToolSet.prototype.updateGradientBrush = function() {
	if(this.brush.gradientTimer >= 255) {
		this.brush.gradientSwitch = true;
	} else if(this.brush.gradientTimer <= 0) {
		this.brush.gradientSwitch = false;
	}
	if(this.brush.gradientSwitch === true) {
		this.brush.gradientTimer -= this.brush.gradientSpeed;
	} else {
		this.brush.gradientTimer += this.brush.gradientSpeed;
	}
};

/*--------------------------------------------
	Update Rainbow Brush
--------------------------------------------*/
ToolSet.prototype.updateRainbowBrush = function() {
	this.brush.rainbowPointer+=this.brush.rainbowSpeed;
	if(this.brush.rainbowPointer >= 255) {
		this.brush.rainbowPointer = 0;
	}
};

export default ToolSet;

