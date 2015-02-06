/**
** Global Variables
**/
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var blackVertexColorBuffer;
var gl;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var shaderProgram;
var pickedColour = {
    r: 255,
    g: 0,
    b: 0
}
var tintCtx;
var tintPointerCtx;
var hueCtx;
var image;
var webglCanvas;
var hueCanvas;
var tintCanvas;
var tintPointerCanvas;
var tintPointer = {
    x: 0,
    y: 0
}
var canMoveTintPointer = false;

/**
** WebGL Functions
**/
function webGLStart() {
    webglCanvas = document.getElementById("webgl-temp");
    tintCanvas = document.getElementById("tint");
    tintCtx = tintCanvas.getContext('2d');
    tintPointerCanvas = document.getElementById("tint-pointer");
    tintPointerCtx = tintPointerCanvas.getContext('2d');
    hueCanvas = document.getElementById("hue");
    hueCtx = hueCanvas.getContext('2d');
    image = new Image();
    image.onload = function() {
        hueCtx.drawImage(image, 0, 0);
    },
    image.src = "img/colour-range.png";
    initGL(webglCanvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    drawColourSquare();
    drawTintPointer();
  }

function initGL(canvas) {
	try {
		gl = canvas.getContext("webgl", { alpha: false } );
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch(e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-( ");
	}
}

function initShaders() {
	var fragmentShader = getShaderFromVar(basicFragShader, "Frag");
	var vertexShader = getShaderFromVar(basicVertShader, "Vert");
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Could not initialise shaders");
	}
	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function getShaderFromVar(shaderSrc, type) {
    var shader;
    if(type == "Vert" || type == "Vertex" || type == "VertexShader") {
        shader = gl.createShader(gl.VERTEX_SHADER);  
    } else if(type == "Frag" || type == "Fragment" || type == "FragmentShader") {
        shader = gl.createShader(gl.FRAGMENT_SHADER); 
    } else {
        console.log("Error: Cannot get shader. Invalid type provided.");
        return;
    }
    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initBuffers() {
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    blackVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, blackVertexColorBuffer);
        var colors = [
        0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 1.0030,
        0.0, 0.0, 0.0, 1.0030
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    blackVertexColorBuffer.itemSize = 4;
    blackVertexColorBuffer.numItems = 4;

    squareVertexColorBuffer = gl.createBuffer();
    var col = checkPrimaryColour(pickedColour.r, pickedColour.g, pickedColour.b);
     gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    var colors = [
        1.0015, 1.0015, 1.0015, 1.0,
        (pickedColour.r / 255) + col.r, (pickedColour.g / 255) + col.g, (pickedColour.b / 255) + col.b, 1.0,
        1.0015, 1.0015, 1.0015, 1.0,
        (pickedColour.r / 255) + col.r, (pickedColour.g / 255) + col.g, (pickedColour.b / 255) + col.b, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
}


function updateColourBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, blackVertexColorBuffer);
        var colors = [
        0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 1.0030,
        0.0, 0.0, 0.0, 1.0030
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    blackVertexColorBuffer.itemSize = 4;
    blackVertexColorBuffer.numItems = 4;

    var col = checkPrimaryColour(pickedColour.r, pickedColour.g, pickedColour.b);
     gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    var colors = [
        1.0015, 1.0015, 1.0015, 1.0,
        (pickedColour.r / 255) + col.r, (pickedColour.g / 255) + col.g, (pickedColour.b / 255) + col.b, 1.0,
        1.0015, 1.0015, 1.0015, 1.0,
        (pickedColour.r / 255) + col.r, (pickedColour.g / 255) + col.g, (pickedColour.b / 255) + col.b, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;

    drawColourSquare();
}

function checkPrimaryColour(r, g, b) {
    var obj = {
        r: 0,
        g: 0,
        b: 0
    }
    if(r == 255) {
        obj.r = 0.0030;
    }

    if(g == 255) {
        obj.g = 0.0030;
    }

    if(b == 255) {
        obj.b = 0.0030;
    }
    return obj;
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function drawColourSquare() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.ortho(this.pMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 100.0);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -1.0]);
    setMatrixUniforms();

    // First gradient
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

    //Second gradient
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, blackVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, blackVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

    tintCtx.drawImage(webglCanvas, 0, 0);
}

function drawTintPointer() {
     // Draw the colour pointer
    tintPointerCtx.clearRect ( 0 , 0 , tintPointerCanvas.width, tintPointerCanvas.height );
    tintPointerCtx.beginPath();
    tintPointerCtx.strokeStyle = 'white';
    tintPointerCtx.arc(tintPointer.x,tintPointer.y,5,0,2*Math.PI);
    tintPointerCtx.stroke();
    tintPointerCtx.beginPath();
    tintPointerCtx.strokeStyle = 'black';
    tintPointerCtx.arc(tintPointer.x,tintPointer.y,6,0,2*Math.PI);
    tintPointerCtx.stroke();
    tintPointerCtx.beginPath();
    tintPointerCtx.strokeStyle = 'white';
    tintPointerCtx.arc(tintPointer.x,tintPointer.y,7,0,2*Math.PI);
    tintPointerCtx.stroke();
}

/**
** Colour Picker Functions
**/
function changeColour() {
    var rgb = {
        r: 0,
        g: 0,
        b: 0
    };
    if(canMoveTintPointer == true) {
        var canvasRect = tintCanvas.getBoundingClientRect();
        if(mouseIsHoveringCanvas(tintCanvas)) {
            tintPointer = getActualMousePos(tintCanvas);
            tintPointer.x -= canvasRect.left;
            tintPointer.y -= canvasRect.top;
        } else {
            var pos = getActualMousePos(tintCanvas);
            if(pos.x < canvasRect.left && pos.y < canvasRect.top) {
                tintPointer.x = 0;
                tintPointer.y = 0;
            } else if(pos.x >= canvasRect.right && pos.y < canvasRect.top) {
                tintPointer.x = 255;
                tintPointer.y = 0;
            } else if(pos.x >= canvasRect.right && pos.y >= canvasRect.bottom) {
                tintPointer.x = 255; 
                tintPointer.y = 255;
            } else if(pos.x < canvasRect.left && pos.y >= canvasRect.bottom) {
                tintPointer.x = 0;
                tintPointer.y = 255;
            } else if(pos.x < canvasRect.left) {
                tintPointer.x = 0;
                tintPointer.y = pos.y - canvasRect.top;
            }  else if(pos.x >= canvasRect.right) {
                tintPointer.x = 255;
                tintPointer.y = pos.y - canvasRect.top;
            } else if(pos.y < canvasRect.top) {
                tintPointer.x = pos.x - canvasRect.left;
                tintPointer.y = 0; 
            } else if(pos.y >= canvasRect.bottom) {
                tintPointer.x = pos.x - canvasRect.left;
                tintPointer.y = 255; 
            }
        }

        rgb = getColourOnTintCanvas();
        pickedColour.r = rgb.r;
        pickedColour.g = rgb.g;
        pickedColour.b = rgb.b;
        brush.setColour(convertRGBToHex(rgb.r, rgb.g, rgb.b));
        var currentColour = document.getElementById('currentColour');
        currentColour.style.width = "100px";
        currentColour.style.height = "100px";
        currentColour.style.backgroundColor = convertRGBToHex(pickedColour.r, pickedColour.g, pickedColour.b);
        assignHTMLValues();

        // Draw the tint pointer because it has moved
        drawTintPointer();
    } else if(mouseIsHoveringCanvas(hueCanvas)) {
        rgb = getColourOnCanvas(hueCanvas, hueCtx);
        pickedColour.r = rgb.r;
        pickedColour.g = rgb.g;
        pickedColour.b = rgb.b;
        brush.setColour(convertRGBToHex(rgb.r, rgb.g, rgb.b));
        var currentColour = document.getElementById('currentColour');
        currentColour.style.width = "100px";
        currentColour.style.height = "100px";
        currentColour.style.backgroundColor = convertRGBToHex(pickedColour.r, pickedColour.g, pickedColour.b);
        var paletteArrow = document.getElementById('palette-arrow');
        paletteArrow.style.top = mousePos.y - 10 + "px";
        assignHTMLValues();
        updateColourBuffer();
                
        // Apply tint based on tint pointer
        rgb = getColourOnTintCanvas();
        pickedColour.r = rgb.r;
        pickedColour.g = rgb.g;
        pickedColour.b = rgb.b;
        brush.setColour(convertRGBToHex(rgb.r, rgb.g, rgb.b));
        var currentColour = document.getElementById('currentColour');
        currentColour.style.width = "100px";
        currentColour.style.height = "100px";
        currentColour.style.backgroundColor = convertRGBToHex(pickedColour.r, pickedColour.g, pickedColour.b);
        assignHTMLValues();
    }
}

function getActualMousePos(canvas) {
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = mousePos.x - left;
    var y = mousePos.y - top;
    return {x: x, y: y};
}

function mouseIsHoveringCanvas(canvas) {
    var pos = getActualMousePos(canvas);
    var canvasRect = canvas.getBoundingClientRect();
    if(pos.x >= canvasRect.left && pos.x <= canvasRect.right 
        && pos.y >= canvasRect.top && pos.y <= canvasRect.bottom) {
        return true;
    } else {
        return false;
    }
}

function assignHTMLValues() {
    var rValue = document.getElementById('rValue');
    rValue.value = pickedColour.r;
    var gValue = document.getElementById('gValue');
    gValue.value = pickedColour.g;
    var bValue = document.getElementById('bValue');
    bValue.value = pickedColour.b;
    var hexValue = document.getElementById('hexValue');
    hexValue.value = convertRGBToHex(pickedColour.r, pickedColour.g, pickedColour.b);
}

function getColourOnTintCanvas() {
    var x = tintPointer.x;
    var y = tintPointer.y;

    // Make sure within array bounds
    if(x >= 254) {
        x = 254;
    }
    if(y >= 254) {
        y = 254;
    }

    var data = tintCtx.getImageData(x, y, 1, 1);
    var pixels = data.data;
    var rgba = {
        r: pixels[0],
        g: pixels[1],
        b: pixels[2],
        a: pixels[3]
    };
    return rgba;
}

function getColourOnCanvas(canvas, ctx){
    var rect = canvas.getBoundingClientRect();
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = mousePos.x - left - rect.left;
    var y = mousePos.y - top - rect.top;

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

/**
** Helper Functions
**/
function getMousePos(evt) {
    return {
        x: evt.clientX,
        y: evt.clientY
    };
}

function convertRGBToHex(red, green, blue){
    var r = red.toString(16);
    var g = green.toString(16);
    var b = blue.toString(16);

    return "#" + binaryResult(r) + binaryResult(g) + binaryResult(b);
}

function binaryResult(col){
    return col.length === 1 ? "0" + col : col;
}

function assignRGBToDom(red, green, blue, hex){
    rgbInputs.r.value = red;
    rgbInputs.g.value = green;
    rgbInputs.b.value = blue;
    rgbInputs.hex.value = hex;
}