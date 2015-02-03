/**
** Global Variables
**/
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
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
var hueCtx;
var image;
var webglCanvas;
var hueCanvas;
var tintCanvas;

/**
** WebGL Functions
**/
function webGLStart() {
    webglCanvas = document.getElementById("webgl-temp");
    tintCanvas = document.getElementById("tint");
    tintCtx = tintCanvas.getContext('2d');
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
    gl.enable(gl.DEPTH_TEST);

    drawColourSquare();
  }

function initGL(canvas) {
	try {
		gl = canvas.getContext("webgl");
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
         5.9,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         5.9, -5.9,  0.0,
        -1.0, -5.9,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    var colors = [
        1.0, 1.0, 1.0, 1.0,
        pickedColour.r / 255, pickedColour.g / 255, pickedColour.b / 255, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
}

function updateColourBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    var colors = [
        1.0, 1.0, 1.0, 1.0,
        pickedColour.r / 255, pickedColour.g / 255, pickedColour.b / 255, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;

    drawColourSquare();
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function drawColourSquare() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
    setMatrixUniforms();
    mat4.translate(mvMatrix, [-3.0, +2.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    tintCtx.drawImage(webglCanvas, 0, 0);
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
    if(mouseIsHoveringCanvas(tintCanvas)) {
        rgb = getColourOnCanvas(tintCanvas, tintCtx);
        pickedColour.r = rgb.r;
        pickedColour.g = rgb.g;
        pickedColour.b = rgb.b;
        brush.setColour(convertRGBToHex(rgb.r, rgb.g, rgb.b));
        var currentColour = document.getElementById('currentColour');
        currentColour.style.width = "100px";
        currentColour.style.height = "100px";
        currentColour.style.backgroundColor = convertRGBToHex(pickedColour.r, pickedColour.g, pickedColour.b);
        assignHTMLValues();
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
    }
}

function mouseIsHoveringCanvas(canvas) {
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = mousePos.x - left;
    var y = mousePos.y - top;
    var canvasRect = canvas.getBoundingClientRect();
    if(x >= canvasRect.left && x <= canvasRect.right 
        && y >= canvasRect.top && y <= canvasRect.bottom) {
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
function getColourOnCanvas(canvas, ctx){
    var rect = canvas.getBoundingClientRect();
    var doc = document.documentElement;
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var x = mousePos.x - left - rect.left;
    var y = mousePos.y - top - rect.top;
    var data = ctx.getImageData(x, y, x, y);
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