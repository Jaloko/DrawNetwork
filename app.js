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
	var sessionid = socket.id;

	socket.on('send message', function(data) {
		for(var i = 0; i < users.length; i++) {
			if(users[i] != null) {
				if(users[i].name == data.name) {
					users[i].colour = data.colour;
					break;
				}
			}
		}
		socket.broadcast.emit('new message', data);
	});

	socket.on('sync', function() {
		socket.broadcast.emit('send canvas', users);
	});

	socket.on('recieve canvas', function(data) {
		var newData = {
			canvas: data
		}
		io.sockets.emit('sync result', newData);
	});

	socket.on('im online', function(data) {
		if(validateText(data.name)) {
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
			}
		}
	});

	socket.on('im offline', function(data) {
		for(var i = 0; i < users.length; i++) {
			if(users[i] != null) {
				if(users[i].name == data.name) {
					users.splice(i, 1);
					break;
				}
			}
		}
	});
});

setInterval(function() {
	io.sockets.emit('user list', users);
	usersConnected = io.engine.clientsCount;
}, 50);


function validateText(text) {
	if(new RegExp('^[A-Za-z0-9 ]*$').test(text)) {
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