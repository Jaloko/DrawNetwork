var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

var users = [];
var usersConnected;
var userCount;

server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection', function(socket) {
	socket.on('send message', function(data) {
		socket.broadcast.emit('new message', data);
	});

	socket.on('sync', function(data) {
		users.push(data.name);
		socket.broadcast.emit('send canvas', users);
	});

	socket.on('recieve canvas', function(data) {
		var newData = {
			canvas: data
		}
		io.sockets.emit('sync result', newData);
	});

	socket.on('im online', function(data) {
		users.push(data);
		userCount++;
	});

	socket.on('im not online', function() {
		userCount++;
	});

	setInterval(function() {
		if(usersConnected == userCount) {
			io.sockets.emit('user list', users);
		}
	}, 100 );

	setInterval(function() {
		usersConnected = io.engine.clientsCount;
		userCount = 0;
  		io.sockets.emit('get online', users);
  		users = [];
	}, 2000 );
});

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