var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server),
	passport = require('passport'),
	crypto = require('crypto'),
	sqlite3 = require('sqlite3').verbose(),
	db = new sqlite3.Database('database.db');

app.use(express.static('client'));

// Set the view engine
app.set('views', 'client/views');
app.set('view engine', 'ejs');

var functions = require('./server/functions.js');
var rooms = [];

require('./server/database.js')(db, crypto, rooms, functions);
require('./server/middleware.js')(app, db, crypto, passport, functions);
require('./server/router.js')(app, passport, db, rooms, functions);
require('./server/sockets.js')(io, db, rooms, functions);
require('./server/locals.js')(app);

server.listen(8080);