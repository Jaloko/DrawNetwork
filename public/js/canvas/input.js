/**
 * Abstract Input Class with Static Methods
 */
var Input = { 
	mouseDown: false,
	mousePos: {
		x: 0,
		y: 0
	},
	lastPos: {
		x: 0,
		y: 0
	}
};

/**
 * Returns the mouse position - must be used in an event listener
 */
Input.getMousePos = function(evt) {
    return {
        x: evt.clientX,
       	y: evt.clientY
    };
}