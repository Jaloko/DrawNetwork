var Dropper = function() { };

Dropper.prototype.onColourChange = function(rgb) {
	var hex = Util.rgbToHex(rgb);
	var hsv = Util.rgbToHsv(rgb.r, rgb.g, rgb.b);
	ColourPicker.tintPosition = new Position(Math.ceil((100 - hsv.s) * 2.55), Math.ceil((100 - hsv.v) * 2.55));
	ColourPicker.huePosition = new Position(0, Math.ceil((360 - hsv.h) / 360 * 255));
	ColourPicker.updateColour();
	tool.brush.setColour(hex);
};

Dropper.prototype.updateColour = function() {
	// This should be in the mouse event code
	if(Util.isMouseOnCanvas(canvas)) {
	// End
		var rgb = Util.getColourOnCanvas(canvas, context);
		this.onColourChange(rgb);
	}
};