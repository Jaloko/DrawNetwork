import { Colour } from "./colour-picker";
import Input from "./input";

/**
 * Abstract Utilities Class with Static Methods
 */
let Util = { 
	randomNames: null
};



/* ------------------------------------ 
	Naming Helper Functions
 ------------------------------------ */
/**
 * Collects a list of names from a text file
 */
Util.getNameList = function(callback) {
	var txtFile = new XMLHttpRequest();
	var tmp = this;
	txtFile.open("GET", "/files/names.txt", true);
	txtFile.onreadystatechange = function() {
		if (txtFile.readyState === 4) {  // document is ready to parse.
			if (txtFile.status === 200) {  // file is found
				allText = txtFile.responseText; 
				lines = txtFile.responseText.split("\n");
				tmp.randomNames = lines;

				callback();
			}
		}
	}
	txtFile.send(null);
};

/**
 * Picks a random name from the name list
 */
Util.pickRandomName = function() {
	var rand = Math.floor(Math.random() * this.randomNames.length);
	return this.randomNames[rand];
};


/* ------------------------------------ 
	General Canvas Helper Functions
 ------------------------------------ */
/**
 * Checks if the mouse position is within a canvases bounds
 */
Util.isMouseOnCanvas = function(canvas) {
    var pos = Input.mousePos;
    let canvasRect = canvas.getBoundingClientRect();
    
    if(pos.x >= canvasRect.left && pos.x <= canvasRect.right 
        && pos.y >= canvasRect.top && pos.y <= canvasRect.bottom) {
        return true;
    } else {
        return false;
    }
};

/**
 * For getting the colour on the provided canvas
 */
Util.getColourOnCanvas = function(canvas, ctx){
    var rect = canvas.getBoundingClientRect();
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = Input.mousePos.x - rect.left;
    var y = Input.mousePos.y - rect.top;

    var data = ctx.getImageData(x, y, 1, 1);
    var pixels = data.data;
    var rgba = {
        r: pixels[0],
        g: pixels[1],
        b: pixels[2],
        a: pixels[3]
    };
    return rgba;
};

/* ------------------------------------ 
	Colour Helper Functions
 ------------------------------------ */
/**
 * Converts rgb to hex
 */
Util.rgbToHex = function(colour) {
	return "#" + ((1 << 24) + (colour.r << 16) + (colour.g << 8) + colour.b).toString(16).slice(1);
};

/**
 * Converts hex to rgb
 */
Util.hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Converts hsv to rgb
 */
Util.hsvToRgb = function(h, s, v) {
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
};

/**
 * Converts rgb to hsv
 */
Util.rgbToHsv = function() {
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
};

export default Util;