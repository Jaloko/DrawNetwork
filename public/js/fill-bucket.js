/**
** Note: This is not finished
**/
function fillBucket(ctx, colour) {
	var colourVal = hexToRgb(colour);
	var colourSelected = getColourOnCanvas().rgba;
	var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	 for(var i = 0; i < imgData.data.length - 4; i+=4) {
	 	if(imgData.data[i] == colourSelected.r && 
	 		imgData.data[i + 1] == colourSelected.g && 
	 		imgData.data[i + 2] == colourSelected.b && 
	 		imgData.data[i + 3] == colourSelected.a) {

	 		imgData.data[i] = colourVal.r;
	 		imgData.data[i + 1] = colourVal.g;
	 		imgData.data[i + 2] = colourVal.b;
	 		imgData.data[i + 3] = 255;
	 	}
	 }
	 context.putImageData(imgData, 0, 0);
	 socket.emit('canvas update', canvas.toDataURL());
}

/**
** Helper function
**/
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}