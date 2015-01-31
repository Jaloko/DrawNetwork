var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));

server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection', function(socket) {
	socket.on('send message', function(data) {
		socket.broadcast.emit('new message', data);
	});

	socket.on('sync', function(data) {
		socket.broadcast.emit('send canvas', data);
	});


	socket.on('recieve canvas', function(data) {
		io.sockets.emit('sync result', data);
	});
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