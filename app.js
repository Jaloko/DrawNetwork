var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

var rooms = [];
rooms.push(new Room("0", "admin"));

var timer = new Date().getTime();

function Room(id, owner) {
	this.id = id,
	this.owner = owner,
	this.users = [],
	this.serverUsers = [],
	this.usersConnected,
	this.storedCanvas
}

server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {

	socket.on('create room', function() {
		if(countRoomsOwnerOf(socket) < 5) {
			var id = rooms.length + "";
			var ip = socket.request.connection.remoteAddress;
			rooms.push(new Room(id, ip));
			socket.emit('room result', id);
			console.log("Room: " + id + " created by: " + ip + "!");
		}
	});

	socket.on('sync', function() {
		var index = getRoomIndex(socket);
		if(rooms[index].users.length >= 2) {
			for(var i = 0; i < rooms[index].serverUsers.length; i++) {
				if(rooms[index].serverUsers[i].id == socket.id) {
					if(rooms[index].serverUsers[i].hasSynced != true) {
						var rand = pickRandom(rooms[index],socket);
						rooms[index].serverUsers[rand].canSync = true;
						io.to(rooms[index].serverUsers[rand].id).emit('send canvas');
						break;
					}
				}
			}
		} else {
			rooms[index].serverUsers[0].hasSynced = true;
			if(rooms[index].storedCanvas != null) {
				socket.emit('sync result', rooms[index].storedCanvas);
			} else {
				socket.emit('sync result', null);
			}
		}
/*		socket.broadcast.emit('send canvas');*/
	});

	socket.on('recieve canvas', function(data) {
		var index = getRoomIndex(socket);
		for(var i = 0; i < rooms[index].serverUsers.length; i++) {
			if(rooms[index].serverUsers[i].id == socket.id) {
				if(rooms[index].serverUsers[i].canSync == true) {
					var newData = data;
					for(var ii = 0; ii < rooms[index].serverUsers.length; ii++) {
						if(rooms[index].serverUsers[ii].hasSynced == false) {
							io.to(rooms[index].serverUsers[ii].id).emit('sync result', newData);
							rooms[index].serverUsers[ii].hasSynced = true;
						}
					}
					rooms[index].serverUsers[i].canSync = false;
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
		var index = getRoomIndex(socket);
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
			for(var i = 0; i < rooms[index].users.length; i++) {
				if(rooms[index].users[i] != null) {
					if(rooms[index].users[i].name == newData.name) {
						if(rooms[index].users[i].colour != newData.colour) {
							rooms[index].users[i].colour = newData.colour;
							if(new Date().getTime() > timer + 100) {
								timer+= 100;
								io.sockets.in(rooms[i].id).emit('user list', rooms[i].users);	
							}
						}
						break;
					}
				}
			}
			socket.broadcast.to(rooms[index].id).emit('sync draw', newData);

			//Old way
/*			socket.broadcast.emit('sync draw', newData);*/
		}
	});

	socket.on('join room', function(data) {
		var newData = {
			id: data,
		};
		if(validateText(newData.id)) {
			if(socket.rooms.length <= 1) {
				socket.join(newData.id);
				socket.emit('room verification');
			}
		}
	});

	socket.on('im online', function(data) {
		var newData = {
			id: data.id,
			name: data.name,
			colour : data.colour
		};
		var index;
		if(validateText(newData.id)) {
			index = getRoomIndex(socket);
		}
		if(index != null) {
			if(validateText(newData.name) && newData.name.length <= 20 && validateHex(newData.colour)) {
				var counter = 0;
				for(var i = 0; i < rooms[index].users.length; i++) {
					if(rooms[index].users[i] != null) {
						if(rooms[index].users[i].name == newData.name) {
							counter++;
						}
					}
				}
				if(counter <= 0) {
					rooms[index].users.push(newData);
					var serverUser = {
						id: socket.id,
						hasSynced: false,
						canSync: false
					}
					rooms[index].serverUsers.push(serverUser);
					socket.emit('user validated');
					io.sockets.in(rooms[index].id).emit('user list', rooms[index].users);
					//old
	/*				io.sockets.emit('user list', users);*/
				}
			}
		}
	});

	socket.on('im offline', function(data) {
		var index = getRoomIndex(socket);
		if(index != null) {
			var newData = {
				name: data.name,
				colour : data.colour
			};
			validateImOffline(rooms[index], newData);
		}
	});

	socket.on('clear canvas', function() {
		var index = getRoomIndex(socket);
		socket.broadcast.to(rooms[index].id).emit('recieve clear canvas');
		// Old
/*		socket.broadcast.emit('recieve clear canvas');*/
	});

	socket.on('im offline store canvas', function(data) {
		var index = getRoomIndex(socket);
		if(index != null) {
			var newData = {
				name: data.name,
				colour: data.colour,
				canvas: data.canvas
			};
			validateImOffline(rooms[index], newData);
			if(rooms[index].users.length == 0) {
				rooms[index].storedCanvas = newData.canvas;
			}
		}
	});
});

function pickRandom(room, socket) {
	var rand = Math.floor(Math.random() * (room.users.length - 1));
	if(socket.id == room.serverUsers[rand].id) {
		pickRandom(room, socket);
	} else {
		return rand;
	}
}

function getRoomIndex(socket) {
	for(var i = 0; i < rooms.length; i++) {
		if(socket.rooms[1] === rooms[i].id) {
			return i;
		}
	}
}

function countRoomsOwnerOf(socket) {
	var counter = 0;
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].owner === socket.request.connection.remoteAddress) {
			counter++;
		}
	}
	return counter;
}

function validateImOffline(room, newData) {
	if(validateText(newData.name) && newData.name.length <= 30 && validateHex(newData.colour)) {
		for(var i = 0; i < room.users.length; i++) {
			if(room.users[i] != null) {
				if(room.users[i].name == newData.name) {
					room.users.splice(i, 1);
					room.serverUsers.splice(i, 1);
					break;
				}
			}
		}
		io.sockets.in(room.id).emit('user list', room.users);
		// Old
/*		io.sockets.emit('user list', users);*/
	}
}

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