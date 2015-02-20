var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

var rooms = [];
rooms.push(new Room(generateId(), "admin", true));

var timer = new Date().getTime();

function Room(id, owner, public) {
	this.id = id,
	this.owner = owner,
	this.public = public,
	this.users = [],
	this.serverUsers = [],
	this.usersConnected,
	this.storedCanvas,
	this.clearVote = {
		vote: false,
		clearTimer: 0,
		timeRemaining: 0,
		timer: 0,
		total: 0,
		yes: 0,
		no: 0
	}
}

server.listen(8080);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {

	socket.on('get room list', function() {
		var theRooms = [];
		for(var i = 0; i < rooms.length; i++) {
			if(rooms[i].public === true) {
				var obj = {
					id: rooms[i].id,
					users: rooms[i].users.length
				};
				theRooms.push(obj);
			}
		}
		socket.emit('recieve room list', theRooms);
	});

	socket.on('create room', function(data) {
		var newData = {
			isPublic: data
		};
		console.log(data);
		if(validateBool(newData.isPublic) === true) {
			if(countRoomsOwnerOf(socket) < 5) {
				var id = generateId();
				var ip = socket.request.connection.remoteAddress;
				rooms.push(new Room(id, ip, newData.isPublic));
				socket.emit('room result', id);
				var isPublic;
				if(newData.isPublic === true) {
					isPublic = "public";
				} else {
					isPublic = "private";
				}

				console.log("Room: " + id + " (" + isPublic + ") created by: " + ip + "!");
			}
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
	});

	socket.on('update colour', function(data) {
		if(new Date().getTime() > timer + 100) {
			timer = new Date().getTime();
			if(validateHex(data)) {
				var index = getRoomIndex(socket);
				var newData = {
					colour: data
				};
				if(index != null) {
					for(var i = 0; i < rooms[index].users.length; i++) {
						if(rooms[index].users[i] != null) {
							if(rooms[index].serverUsers[i].id == socket.id) {
								if(rooms[index].users[i].colour != newData.colour) {
									rooms[index].users[i].colour = newData.colour;
									io.sockets.in(rooms[index].id).emit('user list', rooms[index].users);	
								}
								break;
							}
						}
					}
				}
			}
		}
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
		if(index != null) {
			if(validateText(newData.name) && newData.name.length <= 30 && validateHex(newData.colour)
				&& validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.lastX)
				&& validateNumber(newData.lastY) && validateNumber(newData.size)) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw', newData);
					}
				}
			}
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
						canSync: false,
						hasVoted: false,
						canVote: false,
						voteTimer: 0
					}
					rooms[index].serverUsers.push(serverUser);
					socket.emit('user validated');
					io.sockets.in(rooms[index].id).emit('user list', rooms[index].users);
				}
			}
		}
	});

	socket.on('vote clear', function() {
		var index = getRoomIndex(socket);
		if(index != null) {
			if(rooms[index].clearVote.vote == false) {
				for(var i = 0; i < rooms[index].serverUsers.length; i++) {
					if(socket.id === rooms[index].serverUsers[i].id) {
						if(new Date().getTime() > rooms[index].serverUsers[i].voteTimer + 30000) {
							rooms[index].serverUsers[i].voteTimer = new Date().getTime();
							rooms[index].clearVote.vote = true;
							rooms[index].clearVote.total = rooms[index].users.length;
							rooms[index].clearVote.yes = 0;
							rooms[index].clearVote.no = 0;
							rooms[index].clearVote.timeRemaining = 10;
							for(var ii = 0; ii < rooms[index].serverUsers.length; ii++) {
								rooms[index].serverUsers[ii].canVote = true;
								if(socket.id === rooms[index].serverUsers[ii].id) {
									if(rooms[index].serverUsers[ii].hasVoted === false) {
										rooms[index].serverUsers[ii].voteTimer = new Date().getTime();
										rooms[index].clearVote.yes++;
										rooms[index].serverUsers[ii].hasVoted = true;
									}
								}
							}
							io.sockets.in(rooms[index].id).emit('send vote clear', rooms[index].clearVote.timeRemaining);
							rooms[index].clearVote.timer = new Date().getTime();
							break;
						} else {
							socket.emit('cannot start vote', (rooms[index].serverUsers[i].voteTimer + 30000 - new Date().getTime()) / 1000);
						}
					}
				}
			}
		}
	});

	socket.on('recieve clear vote', function(data) {
		var index = getRoomIndex(socket);
		if(rooms[index].clearVote.vote == true) {
			if(typeof data == "boolean") {
				for(var i = 0; i < rooms[index].serverUsers.length; i++) {
					if(socket.id == rooms[index].serverUsers[i].id) {
						if(rooms[index].serverUsers[i].hasVoted == false && rooms[index].serverUsers[i].canVote == true) {
							if(data == true) {
								rooms[index].clearVote.yes++;
							} else {
								rooms[index].clearVote.no++;
							}
							rooms[index].serverUsers[i].hasVoted = true;
							break;
						}
					}
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

setInterval(function() {
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].clearVote.vote == true) {
			if(rooms[i].clearVote.timeRemaining > 0 && (rooms[i].clearVote.yes + rooms[i].clearVote.no) < rooms[i].clearVote.total) {
				if(new Date().getTime() > rooms[i].clearVote.timer + 1000) {
					rooms[i].clearVote.timeRemaining--;
					rooms[i].clearVote.timer += 1000;
					var data = {
						timeRemaining: rooms[i].clearVote.timeRemaining,
						yesVotes: rooms[i].clearVote.yes,
						noVotes: rooms[i].clearVote.no,
						total: rooms[i].clearVote.total
					};
					io.sockets.in(rooms[i].id).emit('send clear vote timer', data);
				}
			} else {
				var data = {
					timeRemaining: rooms[i].clearVote.timeRemaining,
					yesVotes: rooms[i].clearVote.yes,
					noVotes: rooms[i].clearVote.no,
					total: rooms[i].clearVote.total
				};
				io.sockets.in(rooms[i].id).emit('send clear vote timer', data);
				if(rooms[i].clearVote.yes >= Math.floor(rooms[i].clearVote.total / 2) + 1) {
					io.sockets.in(rooms[i].id).emit('send clear vote result', "Vote passed!");	
					io.sockets.in(rooms[i].id).emit('recieve clear canvas');
				} else {
					io.sockets.in(rooms[i].id).emit('send clear vote result', "Vote failed!");	
				}
				rooms[i].clearVote.vote = false;
				for(var ii = 0; ii < rooms[i].serverUsers.length; ii++) {
					rooms[i].serverUsers[ii].hasVoted = false;
					rooms[i].serverUsers[ii].canVote = true;
				}
				rooms[i].clearVote.clearTimer = new Date().getTime();
			}
		} else {
			if(rooms[i].clearVote.clearTimer != 0) {
				if(new Date().getTime() > rooms[i].clearVote.clearTimer + 1000) {
					rooms[i].clearVote.clearTimer = 0;
					io.sockets.in(rooms[i].id).emit('unlock canvas');	
				}
			}
		}
		// Boot users who have crashed.
		for(var u = 0; u < rooms[i].serverUsers.length; u++) {
			if(io.sockets.connected[rooms[i].serverUsers[u].id] == null) {
				rooms[i].users.splice(u, 1);
				rooms[i].serverUsers.splice(u, 1);
			}
		}
	}
}, 1);

function generateId(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    var counter = 0;
    for(var i = 0; i < rooms.length; i++) {
    	if(text === rooms[i].id) {
    		counter++;
    	}
    }
    if(counter <= 0) {
    	return text;
    } else {
    	generateId();
    }

}

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

function validateBool(bool) {
	if(bool === true || bool === false) {
		return true;
	} else {
		return false
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