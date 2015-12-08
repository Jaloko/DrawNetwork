var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	app.use(express.static('public'));
var passport = require('passport');
var passportLocal = require('passport-local');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var crypto = require('crypto');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

var rooms = [];

db.serialize(function() {
	db.run('CREATE TABLE IF NOT EXISTS users(' +
			'id integer PRIMARY KEY NOT NULL,' +
			'username text NOT NULL,' +
			'password text NOT NULL,' +
			'salt text NOT NULL,' +
			'administrator boolean NOT NULL' +
			')');

	db.run('CREATE TABLE IF NOT EXISTS rooms(' +
			'id text PRIMARY KEY NOT NULL,' +
			'owner text NOT NULL,' +
			'public boolean NOT NULL,' +
			'canvas blob,' +
			'activity integer NOT NULL' +
			')');

	var salt = String(crypto.randomBytes(16));
	var passwordHash = hashPassword("admin215", salt);
	db.run('INSERT OR IGNORE INTO users(id, username, password, salt, administrator) VALUES(1, "admin", "' + passwordHash + '", "' + salt + '", 1)');
	db.get('SELECT COUNT(*) AS rows FROM rooms', function(err, row) {
		if(row.rows == 0) {
			var newRoom = new Room(generateId(), "admin", true);
			rooms.push(newRoom);
			db.run('INSERT OR IGNORE INTO rooms(id, owner, public, activity) VALUES("' + newRoom.id + '", "' + newRoom.owner + '", ' + (newRoom.public ? 1 : 0) + ', ' + newRoom.activity + ')');
			console.log("No rooms in database, created new room.");
		} else {
			var counter = 0;
			db.each('SELECT * FROM rooms', function(err, row) {
				var oldRoom = new Room(row.id, row.owner, row.public == 1 ? true : false);
				oldRoom.storedCanvas = row.canvas;
				oldRoom.activity = row.activity;
				rooms.push(oldRoom);
				counter++;
			}, function() {
				console.log("Successfully loaded " + counter + " room(s) from the database.");
			});
		}
	});
});

// Set the view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded( { extended: true } ));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession( { 
	secret: process.env.SESSION_SECRET || 'secret',
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

// Middleware
passport.use(new passportLocal.Strategy(function(username, password, done) {
	db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
	if (!row) return done(null, false);
	var hash = hashPassword(password, row.salt);
		db.get('SELECT username, id FROM users WHERE username = ? AND password = ? AND administrator = ?', username, hash, 1, function(err, row) {
		    if (!row) return done(null, false);
		    return done(null, row);
		});
	});
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, row) {
		if (!row) return done(null, false);
		return done(null, row);
	});
});

app.get('/acp', function(req, res) {
	if(!req.isAuthenticated()) {
		res.redirect('/login');
	} else {
		var error = 0;
		if(req.query.error == 1) {
			error = 1;
		} else if(req.query.error == 2) {
			error = 2;
		}
		res.render('acp', {
			user: req.user,
			isAuthenticated: req.isAuthenticated(),
			rooms: rooms,
			error: error
		});
	}
});

app.post('/acp', function(req, res) {
	if(req.isAuthenticated()) {
		var roomsToDelete = Object.keys(req.body).map(function(k) { return req.body[k] });

		for(var i = 0; i < roomsToDelete.length; i++) {
			for(var ii = 0; ii < rooms.length; ii++) {
				if(req.body[ii] != undefined) {
					if(rooms[ii].owner != "admin") {
						var roomId = rooms[ii].id;
						deleteRoomInDB(ii);
						rooms.splice(ii, 1);
						io.sockets.in(roomId).emit('room does not exist');
						break;
					}
				}
			}
		}
		// Deprecated
		//writeRoomsToFile();
	}
	res.redirect('/acp');
});

app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
  	failureRedirect: '/login?error=1'
}));

app.get('/login', function(req, res) {
	var error = 0;
	if(req.query.error == 1) {
		error = 1;
	} else if(req.query.error == 2) {
		error = 2;
	}
	res.render('login', {
		isAuthenticated: req.isAuthenticated(),
		user: req.user,
		error: error
	});
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/', function(req, res) {
	res.render('index', {
		isAuthenticated: req.isAuthenticated(),
		user: req.user
	});
});

app.get('/rooms', function(req, res) {
	var publicRooms = [];
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].public == true) {
			publicRooms.push({ id: rooms[i].id, numberOfUsers: rooms[i].users.length, activity: rooms[i].activity});
		}
	}
	var error = 0;
	if(req.query.error == 1) {
		error = 1;
	} else if(req.query.error == 2) {
		error = 2;
	}
	res.render('rooms', {
		isAuthenticated: req.isAuthenticated(),
		rooms: publicRooms,
		user: req.user,
		error: error
	});
});

app.post('/acp/rooms/create', function(req, res) {
	createRoom(req, res, '/acp');
});

app.post('/rooms/create', function(req, res) {
	createRoom(req, res, '/rooms');
});

function createRoom(req, res, location) {
	var newData = {
		isPublic: true
	};
	if(req.body.onoffswitch === "on") {
		newData.isPublic = true;
	} else {
		newData.isPublic = false;
	}
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if(validateBool(newData.isPublic) === true) {
		if(countRoomsOwnerOf(ip) < 5) {
			var id = generateId();
			// socket.handshake.address || socket.client.conn.remoteAddress || socket.conn.remoteAddress
/*			var ip = req.socket.request.connection.remoteAddress;*/
			if(ip != null) {
				var newRoom = new Room(id, ip, newData.isPublic);
				rooms.push(newRoom);
				db.run('INSERT OR IGNORE INTO rooms(id, owner, public, activity) VALUES($id, $owner, $public, $activity)', {
					$id: newRoom.id,
					$owner: newRoom.owner,
					$public: newRoom.public ? 1 : 0,
					$activity: newRoom.activity
				});
				//socket.emit('room result', id);
				res.redirect('/rooms/' + newRoom.id);
				var isPublic;
				if(newData.isPublic === true) {
					isPublic = "public";
				} else {
					isPublic = "private";
				}
				console.log("Room: " + id + " (" + isPublic + ") created by: " + ip + "!");
			} else {
				// Insert error handling here
				res.redirect(location + '?error=2');
			}
		} else {
			// Insert error handling here
			res.redirect(location + '?error=1');
		}
	}
}

app.get('/rooms/:uid', function(req, res){
    var uid = req.params.uid;
    res.render('canvas', {
    	isAuthenticated: req.isAuthenticated(),
    	user: req.user,
    	roomId: uid
    });
});

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

io.sockets.on('connection', function(socket) {

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

	socket.on('draw pentagon', function(data) {
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
						socket.broadcast.to(rooms[index].id).emit('sync draw pentagon', newData);
					}
				}
			}
		}
	});

	socket.on('draw hexagon', function(data) {
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
						socket.broadcast.to(rooms[index].id).emit('sync draw hexagon', newData);
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

	socket.on('draw square', function(data) {
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
			if(validateText(newData.name) && newData.name.length <= 30
				&& validateNumber(newData.x) && validateNumber(newData.y) && validateNumber(newData.lastX)
				&& validateNumber(newData.lastY) && validateNumber(newData.size) && newData.size > 0 && newData.size <= 100
				&& validateHex(newData.colour)) {
				if(rooms[index].users != null) {
					if(rooms[index].clearVote.vote == false) {
						socket.broadcast.to(rooms[index].id).emit('sync draw square', newData);
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

	socket.on('does room exist', function(data) {
		var newData = {
			id: data,
		};
		if(validateText(newData.id)) {
			var isRoom = false
			for(var i = 0; i < rooms.length; i++) {
				if(rooms[i].id == newData.id) {
					isRoom = true;
					break;
				}
			}
			if(isRoom) {
				socket.emit('does room exist result', isRoom);
			} else {
				socket.emit('does room exist result', isRoom);
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
							ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address,
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
			// Delete rooms that have more than 3 days of inactivity
			if(new Date().getTime() > parseInt(rooms[i].activity) + 259200000) {
				deleteRoomInDB(i);
				rooms.splice(i, 1);
				// Deprecated
				//writeRoomsToFile();
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
			updateRoomsInDB();
			// Deprecated
			//writeRoomsToFile();
		}
	} else{
		if(finalSaveRooms === true) {
			finalSaveRooms = false;
			updateRoomsInDB();
			// Deprecated
			//writeRoomsToFile();
		}
	}

}, 1);

function updateRoomInDB(index) {
	db.run('UPDATE rooms SET canvas = "' + rooms[index].storedCanvas + '", activity = ' + rooms[index].activity + ' WHERE id = "' + rooms[index].id + '"');
}

function deleteRoomInDB(index) {
	db.run('DELETE FROM rooms WHERE id = "' + rooms[index].id + '"');
}

// Assumes the rooms in db are the same as in memory - which they will be
function updateRoomsInDB() {
	for(var r = 0; r < rooms.length; r++) {
		updateRoomInDB(r);
	}
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

app.locals.convertTime = function(time) {
    var timeString = "";
    var suffix = "now";
    if(time === 1) {
        suffix = "second"
    } else if(time > 1 && time < 60) {
        suffix = "seconds";
    } else if(time >= 60 && time < 120) {
        time = time / 60;
        suffix = "minute"
    } else if(time >= 120 && time < 3600) {
        time = time / 60;
        suffix = "minutes"
    } else if(time >= 3600 && time < 7200) {
        time = (time / 60) / 60;
        suffix = "hour"
    } else if(time >= 7200 && time < 86400) {
        time = (time / 60) / 60;
        suffix = "hours"
    } else if(time >= 86400 && time < 172800) {
        time = ((time / 60) / 60) / 24;
        suffix = "day"
    } else if(time >= 172800) {
        time = ((time / 60) / 60) / 24;
        suffix = "days"
    }
    time = Math.floor(time);
    if(suffix === "now") {
        timeString = suffix;
    } else {
        timeString = time + " " + suffix;
    }
    return timeString;
}