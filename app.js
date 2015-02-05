var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

var users = [];
var usersConnected;
server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection', function(socket) {

	socket.on('sync', function() {
		socket.broadcast.emit('send canvas', users);
	});

	socket.on('recieve canvas', function(data) {
		var newData = {
			canvas: data
		}
		io.sockets.emit('sync result', newData);
	});

	socket.on('draw', function(data) {
		if(validateText(data.name) && data.name.length <= 30 && validateHex(data.colour)
			&& validateNumber(data.x) && validateNumber(data.y) && validateNumber(data.lastX)
			&& validateNumber(data.lastY) && validateNumber(data.size)) {
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == data.name) {
						users[i].colour = data.colour;
						break;
					}
				}
			}
			socket.broadcast.emit('sync draw', data);
		}
	});

	socket.on('im online', function(data) {
		if(validateText(data.name) && data.name.length <= 30 && validateHex(data.colour)) {
			var counter = 0;
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == data.name) {
						counter++;
					}
				}
			}
			if(counter <= 0) {
				users.push(data);
				socket.emit('user validated');
				io.sockets.emit('user list', users);
			}
		}
	});

	socket.on('im offline', function(data) {
		if(validateText(data.name) && data.name.length <= 30 && validateHex(data.colour)) {
			for(var i = 0; i < users.length; i++) {
				if(users[i] != null) {
					if(users[i].name == data.name) {
						users.splice(i, 1);
						break;
					}
				}
			}
			io.sockets.emit('user list', users);
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