// I added this to avoid making to much code change as this isnt part of the refactor.
// I wanted to keep as much of the original codebase as-is

let socket = io.connect();
let tool;
let client = {
	// Name of the current user
	name: null,
	// Used during initialization to check if the clients canvas has synced to the server
	hasSynced: false,
	// Is set to true when the mouse hovers over the drawing canvas
	canDraw: false,
	// Stops the client drawing while the voting screen is active
	currentlyVoting: false,
	// Stops the client drawing while the saving screen is active
	currentlySaving: false,
	// Number of messages sent while users tab is active
	messageCounter: 0,
	// Number of user join/leaves while chat tab is active
	userJoinCounter: 0
};
let canvas = document.querySelector("#canvas");
let context = canvas.getContext("2d");
let pointerCanvas = document.querySelector("#pointer-canvas");
let pointerContext = pointerCanvas.getContext("2d");

export {
    socket,
    tool,
    client,
    canvas,
    context,
    pointerCanvas,
    pointerContext
};



