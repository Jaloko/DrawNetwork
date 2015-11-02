/* ------------------------------------ 
	Object Definitions
 ------------------------------------ */
var Colour = function(r, g, b) {
	this.r = r,
	this.g = g,
	this.b = b
};

var Position = function(x, y) {
	this.x = x,
	this.y = y
};

/* ------------------------------------ 
	Globals
 ------------------------------------ */
var tintPosition = new Position(0, 0);
var huePosition = new Position(0, 0);
var canMoveTintPointer = false;
var canMoveHuePointer = false;
var colourTimer = new Date().getTime();
var tintImage = new Image();
tintImage.src = "/images/tint.png";
tintImage.onload = function() {
   createTint(getTintContext(), new Colour(255, 0, 0)); 
};

/* ------------------------------------ 
	Functions
 ------------------------------------ */
function initColourPicker() {
    document.getElementById('colour-picker').style.cursor = "crosshair";
	createTint(getTintContext(), new Colour(255, 0, 0));
	createHue(getHueContext());
	drawTintPointer(getTintPointerContext(), new Position(0, 0));
}

function createTint(ctx, colour) {
	ctx.fillStyle = rgbToHex(colour);
	ctx.fillRect(0, 0, 256, 256);
	ctx.fillStyle = rgbToHex(colour);
	ctx.drawImage(tintImage, 0, 0);
}

function createHue(ctx) {
	for(var x = 0; x <= ctx.canvas.width; x++) {
		for(var y = 0; y <= 255; y++) {
			ctx.fillStyle = rgbToHex(hsvToRgb(1 - (y / 256), 1, 1));
			ctx.fillRect(x, y, x + 1, y + 1);
		}
	}
}

function changeColour() {
	if(canMoveHuePointer) {
		var hueRect = getHueContext().canvas.getBoundingClientRect();
		var huePosition = new Position(mousePos.x - hueRect.left, mousePos.y - hueRect.top);
		enforceHueBounds(huePosition);
        createTint(getTintContext(), getColourOnHueCanvas(getHueContext(), huePosition));

		getHueArrows()[0].style.top = huePosition.y - 7;
		getHueArrows()[1].style.top = huePosition.y - 7;
        // Set Colours
        var currentColour = document.getElementById('currentColour');
        currentColour.style.backgroundColor = rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition));
        tool.brush.setColour(rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition)));
	}
	if(canMoveTintPointer) {
		var tintRect = getTintContext().canvas.getBoundingClientRect();
		tintPosition = new Position(mousePos.x - tintRect.left, mousePos.y - tintRect.top);
		enforceTintBounds(tintPosition);
		drawTintPointer(getTintPointerContext(), tintPosition);
        // Set Colours
        var currentColour = document.getElementById('currentColour');
        currentColour.style.backgroundColor = rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition));
        tool.brush.setColour(rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition)));
	}
    if(new Date().getTime() > colourTimer + 200) {
        colourTimer = new Date().getTime();
        socket.emit('update colour', tool.brush.colour); 
    }
}

function updateColour() {
    var currentColour = document.getElementById('currentColour');
    currentColour.style.backgroundColor = rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition));
    tool.brush.setColour(rgbToHex(getColourOnTintCanvas(getTintContext(), tintPosition)));
    getHueArrows()[0].style.top = huePosition.y - 7;
    getHueArrows()[1].style.top = huePosition.y - 7;
    createTint(getTintContext(), getColourOnHueCanvas(getHueContext(), huePosition));
    drawTintPointer(getTintPointerContext(), tintPosition);
    if(new Date().getTime() > colourTimer + 200) {
        colourTimer = new Date().getTime();
        socket.emit('update colour', tool.brush.colour); 
    }
}

/* ------------------------------------ 
	Helper Functions
 ------------------------------------ */
function getTintContext() {
	var tint = document.getElementById("tint");
	return tint.getContext("2d");
}

function getHueContext() {
	var hue = document.getElementById("hue");
	return hue.getContext("2d");
}

function getTintPointerContext() {
	var tintPointer = document.getElementById("tint-pointer");
	return tintPointer.getContext("2d");
}

function getHueArrows() {
	return[document.getElementById("hue-arrow-left"),
	document.getElementById("hue-arrow-right")];
}

function isMouseHoveringTintCanvas() {
	if(mouseIsHoveringCanvas(getTintContext().canvas)) {
		return true;
	} else {
		return false;
	}
}

function isMouseHoveringHueCanvas() {
	if(mouseIsHoveringCanvas(getHueContext().canvas)) {
		return true
	} else {
		return false;
	}
}

function mouseIsHoveringCanvas(canvas) {
    var pos = mousePos;
    canvasRect = canvas.getBoundingClientRect();
    if(pos.x >= canvasRect.left && pos.x <= canvasRect.right 
        && pos.y >= canvasRect.top && pos.y <= canvasRect.bottom) {
        return true;
    } else {
        return false;
    }
}

function drawTintPointer(ctx, position) {
    // Draw the colour pointer
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.width);
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.arc(position.x,position.y,5,0,2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(position.x,position.y,6,0,2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.arc(position.x,position.y,7,0,2*Math.PI);
    ctx.stroke();
}

function getColourOnTintCanvas(ctx, position) {
    var x = position.x;
    var y = position.y;

    // Make sure within array bounds
    if(x >= 255) {
        x = 255;
    }
    if(y >= 255) {
        y = 255;
    }

    var data = ctx.getImageData(x, y, 1, 1);
    var pixels = data.data;
    var rgba = {
        r: pixels[0],
        g: pixels[1],
        b: pixels[2],
        a: pixels[3]
    };
    return new Colour(rgba.r, rgba.g, rgba.b);
}

function getColourOnHueCanvas(ctx, position) {
    var y = position.y;

    // Make sure within array bounds
    if(y >= 255) {
        y = 255;
    }

    var data = ctx.getImageData(0, y, 1, y + 1);
    var pixels = data.data;
    var rgba = {
        r: pixels[0],
        g: pixels[1],
        b: pixels[2],
        a: pixels[3]
    };
    return new Colour(rgba.r, rgba.g, rgba.b);
}

// To be removed in the future - still currently used
function getColourOnCanvas(canvas, ctx){
    var rect = canvas.getBoundingClientRect();
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = mousePos.x - rect.left;
    var y = mousePos.y - rect.top;

    var data = ctx.getImageData(x, y, 1, 1);
    var pixels = data.data;
    var rgba = {
        r: pixels[0],
        g: pixels[1],
        b: pixels[2],
        a: pixels[3]
    };
    return rgba;
}

function enforceTintBounds(position) {
	var tintRect = getTintContext().canvas.getBoundingClientRect();
    var pos = mousePos;
    if(pos.x < tintRect.left && pos.y < tintRect.top) {
        position.x = 0;
        position.y = 0;
    } else if(pos.x >= tintRect.right && pos.y < tintRect.top) {
        position.x = 255;
        position.y = 0;
    } else if(pos.x >= tintRect.right && pos.y >= tintRect.bottom) {
        position.x = 255; 
        position.y = 255;
    } else if(pos.x < tintRect.left && pos.y >= tintRect.bottom) {
        position.x = 0;
        position.y = 255;
    } else if(pos.x < tintRect.left) {
        position.x = 0;
        position.y = pos.y - tintRect.top;
    }  else if(pos.x >= tintRect.right) {
        position.x = 255;
        position.y = pos.y - tintRect.top;
    } else if(pos.y < tintRect.top) {
        position.x = pos.x - tintRect.left;
        position.y = 0; 
    } else if(pos.y >= tintRect.bottom) {
        position.x = pos.x - tintRect.left;
        position.y = 255; 
    }
}

function enforceHueBounds(position) {
	var hueRect = getHueContext().canvas.getBoundingClientRect();
    var pos = mousePos;
    if((pos.x < hueRect.left && pos.y < hueRect.top) || (pos.x >= hueRect.right && pos.y < hueRect.top)) {
        position.x = 0;
        position.y = 0;
    } else if((pos.x >= hueRect.right && pos.y >= hueRect.bottom) || (pos.x < hueRect.left && pos.y >= hueRect.bottom)) {
        position.x = 0; 
        position.y = 256;
    } else if(pos.x < hueRect.left || pos.x >= hueRect.right) {
        position.x = 0;
        position.y = pos.y - hueRect.top;
    } else if(pos.y < hueRect.top) {
        position.x = pos.x - hueRect.left;
        position.y = 0; 
    } else if(pos.y >= hueRect.bottom) {
               position.x = pos.x - hueRect.left;
        position.y = 256;  
    }
} 

/* ------------------------------------ 
	Colour Helper Functions
 ------------------------------------ */
function rgbToHex(colour) {
	return "#" + ((1 << 24) + (colour.r << 16) + (colour.g << 8) + colour.b).toString(16).slice(1);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return new Colour(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function rgbToHsv() {
    var rr, gg, bb,
        r = arguments[0] / 255,
        g = arguments[1] / 255,
        b = arguments[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}