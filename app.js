var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

var users = [];
var serverUsers = [];
var usersConnected;

var storedCanvas;

server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


function pickRandom(socket) {
	var rand = Math.floor(Math.random() * (users.length - 1));
	if(socket.id == serverUsers[rand].id) {
		pickRandom()
	} else {
		return rand;
	}
}

io.sockets.on('connection', function(socket) {
	socket.on('sync', function() {
/*		io.engine.clientsCount*/
		if(users.length >= 2) {
			for(var i = 0; i < serverUsers.length; i++) {
				if(serverUsers[i].id == socket.id) {
					if(serverUsers[i].hasSynced != true) {
						var rand = pickRandom(socket);
						serverUsers[rand].canSync = true;
						io.to(serverUsers[rand].id).emit('send canvas');
						break;
					}
				}
			}
		} else {
			serverUsers[0].hasSynced = true;
			if(storedCanvas != null) {
				socket.emit('sync result', storedCanvas);
			} else {
				socket.emit('sync result', null);
			}
		}
/*		socket.broadcast.emit('send canvas');*/
	});

	socket.on('recieve canvas', function(data) {
		for(var i = 0; i < serverUsers.length; i++) {
			if(serverUsers[i].id == socket.id) {
				if(serverUsers[i].canSync == true) {
					var newData = data;
					for(var ii = 0; ii < serverUsers.length; ii++) {
						if(serverUsers[ii].hasSynced == false) {
							io.to(serverUsers[ii].id).emit('sync result', newData);
							serverUsers[ii].hasSynced = true;
						}
					}
					serverUsers[i].canSync = false;
					break;
				}
			}
		}
/*		var newData = {
			canvas: data
		}
		io.sockets.emit('sync result', newData);*/
	});

	socket.on('draw', function(data) {
		var newData = {
			name: data.name,
			x: data.x,
			y: data.y,
			lastX: data.lastX,
			lastY: data.lastY,
			size: data.size,
			colour: data.colour
		};
		if(validateText(newData.name) && newData.name.length <= 30 && validateHex(newData.colour)
			&& validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.lastX)
			&& validateNumber(newData.lastY) && validateNumber(newData.size)) {
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == newData.name) {
						users[i].colour = newData.colour;
						break;
					}
				}
			}
			socket.broadcast.emit('sync draw', newData);
		}
	});

	socket.on('im online', function(data) {
		var newData = {
			name: data.name,
			colour : data.colour
		};
		if(validateText(data.name) && newData.name.length <= 30 && validateHex(newData.colour)) {
			var counter = 0;
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == newData.name) {
						counter++;
					}
				}
			}
			if(counter <= 0) {
				users.push(newData);
				var serverUser = {
					id: socket.id,
					hasSynced: false,
					canSync: false
				}
				serverUsers.push(serverUser);
				socket.emit('user validated');
				io.sockets.emit('user list', users);
			}
		}
	});

	socket.on('im offline', function(data) {
		var newData = {
			name: data.name,
			colour : data.colour
		};
		if(validateText(newData.name) && newData.name.length <= 30 && validateHex(newData.colour)) {
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == newData.name) {
						users.splice(i, 1);
						serverUsers.splice(i, 1);
						break;
					}
				}
			}
			io.sockets.emit('user list', users);
		}
	});

	socket.on('clear canvas', function() {
		socket.broadcast.emit('recieve clear canvas');
	});

	socket.on('store canvas', function(data) {
		if(users.length == 1) {
			storedCanvas = data;
		}
	});
});

function validateText(text) {
	if(new RegExp('^[A-Za-z0-9 ]+$').test(text)) {
		return true;
	} else {
		return false;
	}
}

function validateHex(hex) {
	if(new RegExp('^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$').test(hex)) {
		return true;
	} else {
		return false;
	}
}

function validateNumber(number) {
	if(new RegExp('[0-9]').test(number)) {
		return true;
	} else {
		return false;
	}
}

/**Halp
// send to current request socket client
socket.emit('message', "this is a test");
// sending to all clients, include sender
io.sockets.emit('message', "this is a test");
// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");
// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');
// sending to all clients in 'game' room(channel), include sender
io.sockets.in('game').emit('message', 'cool game');
// sending to individual socketid
io.to(socketid).emit('message', 'for your eyes only');
// send to all clients within the current namespace
socket.nsp.emit('message', 'for everyone in the namespace');
// send to all clients within the current namespace within a room
socket.nsp.in('game').emit('message', 'to all my people in the game in this namespace');**/