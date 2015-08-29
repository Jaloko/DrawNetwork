var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs');
	app.use(express.static('public'));

var rooms = [];

// Create the file if it doesnt exist
fs.exists(__dirname + "/rooms.txt", function(exists) {
    if (!exists) {
		fs.writeFile(__dirname + "/rooms.txt", '', function(){});
    }
    readFile();
});

function readFile() {
	// Load room data from the file
	fs.readFile(__dirname + "/rooms.txt", function(err, data) {
	    if(err) throw err;
	    var array = data.toString().split("\n");
	    if(array.length <= 1) {
			rooms.push(new Room(generateId(), "admin", true));
			console.log("No rooms in file, created new room.");
	    } else {
		    for(var r = 0; r < array.length / 5; r++) {
		    	var room = new Room(array[r * 5], array[r * 5 + 1], Boolean(array[r * 5 + 2]));
		    	room.storedCanvas = array[r * 5 + 3];
		    	room.activity = array[r * 5 + 4];
		    	rooms.push(room);
		    }
		    console.log("Successfully loaded rooms from file.");
	    }
	});
}

var timer = new Date().getTime();
var saveRoomsTimer = new Date().getTime();
var finalSaveRooms = false;

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
	},
	this.activity = new Date().getTime()
}

server.listen(8080);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
	var ip = socket.request.connection.remoteAddress;

	socket.on('get room list', function() {
		var theRooms = [];
		for(var i = 0; i < rooms.length; i++) {
			if(rooms[i].public === true) {
				var obj = {
					id: rooms[i].id,
					users: rooms[i].users.length,
					activity: rooms[i].activity
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
		if(validateBool(newData.isPublic) === true) {
			if(countRoomsOwnerOf(ip) < 5) {
				var id = generateId();
				if(ip != null) {
					rooms.push(new Room(id, ip, newData.isPublic));
					socket.emit('room result', id);
					var isPublic;
					if(newData.isPublic === true) {
						isPublic = "public";
					} else {
						isPublic = "private";
					}
					console.log("Room: " + id + " (" + isPublic + ") created by: " + ip + "!");
				} else {
					socket.emit('cannot create room', 'Error identifying remote address: ' + ip + '. Try again.');
				}
			} else {
				socket.emit('cannot create room', 'You have already created 5 rooms!');
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
									io.sockets.in(rooms[index].id).emit('sync user colour', rooms[index].users);	
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
				&& validateNumber(newData.lastY) && validateNumber(newData.size)
				&& newData.size > 0 && newData.size <= 100) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw', newData);
					}
				}
			}
		}
	});

	socket.on('draw text', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			x: data.x,
			y: data.y,
			font: data.font,
			colour: data.colour,
			text: data.text
		};
		if(index != null) {
			if(validateNumber(newData.x) && validateNumber(newData.y) && validateHex(newData.colour)
				&& validateText(newData.font) && validateText(newData.text)) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw text', newData);
					}
				}
			}
		}

	});

	socket.on('draw rect', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			x: data.x,
			y: data.y,
			endX: data.endX,
			endY: data.endY,
			colour: data.colour
		};
		if(index != null) {
			if(validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.endX) 
				&& validateNumber(newData.endY) && validateHex(newData.colour)) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw rect', newData);
					}
				}
			}
		}
	});

	socket.on('draw circle', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			x: data.x,
			y: data.y,
			endX: data.endX,
			endY: data.endY,
			colour: data.colour
		};
		if(index != null) {
			if(validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.endX) 
				&& validateNumber(newData.endY) && validateHex(newData.colour)) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw circle', newData);
					}
				}
			}
		}
	});

	socket.on('draw line', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			x: data.x,
			y: data.y,
			endX: data.endX,
			endY: data.endY,
			lineTip: data.lineTip,
			size: data.size,
			colour: data.colour
		};
		if(index != null) {
			if(validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.endX) 
				&& validateNumber(newData.endY) && validateText(newData.lineTip) && validateNumber(newData.size)
				 && validateHex(newData.colour) && newData.size > 0 && newData.size <= 100) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw line', newData);
					}
				}
			}
		}
	});

	socket.on('erase', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			name: data.name,
			x: data.x,
			y: data.y,
			lastX: data.lastX,
			lastY: data.lastY,
			size: data.size
		};
		if(index != null) {
			if(validateText(newData.name) && newData.name.length <= 30
				&& validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.lastX)
				&& validateNumber(newData.lastY) && validateNumber(newData.size) && newData.size > 0 && newData.size <= 100) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync erase', newData);
					}
				}
			}
		}
	});

	socket.on('chat message', function(data) {
		var index = getRoomIndex(socket);
		var newData = {
			name: data.name,
			message: data.message
		};
		if(index != null) {
			if(validateText(newData.name) && validateText(newData.message) && newData.message.length <= 300 &&
				newData.message.length > 0) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						for(var i = 0; i < rooms[index].users.length; i++) {
							if(rooms[index].users[i] != null) {
								if(rooms[index].users[i].name === newData.name) {
									if(rooms[index].serverUsers[i].id === socket.id) {
										socket.broadcast.to(rooms[index].id).emit('sync chat message', newData);
										break;
									}
								}
							}
						}
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
				if(rooms[index].users.length < 10) {
					var counter = 0;
					for(var i = 0; i < rooms[index].users.length; i++) {
						if(rooms[index].users[i] != null) {
							if(rooms[index].users[i].name === newData.name) {
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
						rooms[index].activity = new Date().getTime();
						socket.emit('user validated');
						io.sockets.in(rooms[index].id).emit('user list', rooms[index].users);
					} else {
						socket.leave(newData.id);
						socket.emit('name taken');
					}
				} else {
					socket.leave(newData.id);
					socket.emit('room full');
				}
			}
		}
		else{
			socket.emit('room does not exist');
		}
	});

	socket.on('vote clear', function() {
		var index = getRoomIndex(socket);
		if(index != null) {
			if(rooms[index].clearVote.vote == false) {
				for(var i = 0; i < rooms[index].serverUsers.length; i++) {
					if(socket.id === rooms[index].serverUsers[i].id) {
						if(new Date().getTime() > rooms[index].serverUsers[i].voteTimer + 30000 || rooms[index].serverUsers.length === 1) {
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
						} else {
							socket.emit('cannot start vote', (rooms[index].serverUsers[i].voteTimer + 30000 - new Date().getTime()) / 1000);
						}
						break;
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
			validateImOffline(rooms[index], newData, socket);
			rooms[index].activity = new Date().getTime();
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
			validateImOffline(rooms[index], newData, socket);
			rooms[index].activity = new Date().getTime();
			if(rooms[index].users.length <= 0) {
				if(newData.canvas.length <= 9999999) {
					rooms[index].storedCanvas = newData.canvas;
				}
			}
		}
	});

	socket.on('store canvas', function(data) {
		var index = getRoomIndex(socket);
		if(index != null) {
			var newData = {
				canvas: data.canvas
			};
			rooms[index].activity = new Date().getTime();
			if(newData.canvas.length <= 9999999) {
				rooms[index].storedCanvas = newData.canvas;
				socket.emit('canvas saved');
			}
		}
	});
});

setInterval(function() {
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].users.length === 0 && rooms[i].owner != "admin") {
			if(new Date().getTime() > rooms[i].activity + 259200000) {
				rooms.splice(i, 1);
				writeRoomsToFile();
				continue;
			}
		}
		if(rooms[i].clearVote.vote == true) {
			if(rooms[i].clearVote.timeRemaining > 0 && rooms[i].clearVote.yes < Math.floor(rooms[i].clearVote.total / 2) + 1 &&
			rooms[i].clearVote.total - rooms[i].clearVote.no >= Math.floor(rooms[i].clearVote.total / 2) + 1 && rooms[i].clearVote.yes + rooms[i].clearVote.no < rooms[i].clearVote.total) {
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
	var counter = 0;
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].users.length != 0) {
			counter++;
		}
	}
	if(counter > 0) {
		if(new Date().getTime() > saveRoomsTimer + 1000) {
			finalSaveRooms = true;
			saveRoomsTimer = new Date().getTime();
			writeRoomsToFile();
		}
	} else{
		if(finalSaveRooms === true) {
			finalSaveRooms = false;
			writeRoomsToFile();
		}
	}

}, 1);

function writeRoomsToFile() {
	fs.writeFile(__dirname + "/rooms.txt", '', function(){});
	fs.writeFile(__dirname + "/rooms.txt", saveRooms(), function(err) {
	    if(err) {
	        console.log(err);
	    }
	});
}

function saveRooms() {
	var text = "";
	for(var r = 0; r < rooms.length; r++) {
		text += rooms[r].id + "\n";
		text += rooms[r].owner + "\n";
		text += rooms[r].public + "\n";
		text += rooms[r].storedCanvas + "\n";
		text += rooms[r].activity;
		if(r != rooms.length -1) {
			text += "\n";
		}
	}
	return text;
} 

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

function countRoomsOwnerOf(ip) {
	var counter = 0;
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].owner === ip) {
			counter++;
		}
	}
	return counter;
}

function validateImOffline(room, newData, socket) {
	if(validateText(newData.name) && newData.name.length <= 30 && validateHex(newData.colour)) {
		for(var i = 0; i < room.users.length; i++) {
			if(room.users[i] != null) {
				if(room.users[i].name === newData.name && room.serverUsers[i].id === socket.id) {
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