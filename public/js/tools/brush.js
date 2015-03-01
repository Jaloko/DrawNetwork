var Brush = function(){
	this.size = 30,
	this.colour = "#ff0000",
	this.brushType = "freeroam",
	this.lineTip = "round",

	// Gradient related

	this.gradientTimer = 0,
	this.gradientSpeed = 1,

	this.setBrushType = function(type){
		this.brushType = type;
	},

	this.getBrushType = function(){
		return this.brushType;
	}

	this.setColour = function(newColour){
		this.colour = newColour;
	}
};