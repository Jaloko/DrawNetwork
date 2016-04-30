module.exports = function(app, passport, db, rooms, functions) {

	app.get('/acp', function(req, res) {
		if(!req.isAuthenticated()) {
			res.redirect('/login');
		} else {
			res.redirect('/acp/rooms');
	/*		res.render('acp', {
				user: req.user,
				isAuthenticated: req.isAuthenticated()
			});*/
		}
	});

	app.get('/acp/rooms', function(req, res) {
		if(!req.isAuthenticated()) {
			res.redirect('/login');
		} else {
			var error = 0;
			if(req.query.error == 1) {
				error = 1;
			} else if(req.query.error == 2) {
				error = 2;
			}
			res.render('acp-rooms', {
				user: req.user,
				isAuthenticated: req.isAuthenticated(),
				rooms: rooms,
				error: error
			});
		}
	});

	app.get('/acp/analytics', function(req, res) {
		if(!req.isAuthenticated()) {
			res.redirect('/login');
		} else {
			var json = {
				day: null,
				week: Array(),
				month: Array()
			}

			// Get todays stats
			db.get("SELECT * FROM visitors WHERE date = date('" + functions.getDate() + "')", function(err, row) {
				if(row != undefined) {
					json.day = row;
				}
				// Get this weeks stats
				var d = new Date(functions.getDate());
				d.setDate(d.getDate()-6);
				db.each("SELECT * FROM visitors WHERE date BETWEEN date('" + functions.getDate(d) + "') AND date('" + functions.getDate() + "')", function(err, row) {
					if(row != undefined) {
						json.week.push(row);
					}
				}, function() {
					// Get this months stats
					var d = new Date(functions.getDate());
		 			d.setDate(d.getDate()-functions.daysInMonth(new Date()));
					db.each("SELECT * FROM visitors WHERE date BETWEEN date('" + functions.getDate(d) + "') AND date('" + functions.getDate() + "')", function(err, row) {
						if(row != undefined) {
							json.month.push(row);
						}
					}, function() {
						res.render('acp-analytics', {
							user: req.user,
							isAuthenticated: req.isAuthenticated(),
							analytics: json
						});
					});
				});
			});

		}
	});


	app.post('/acp/rooms', function(req, res) {
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
		}
		res.redirect('/acp/rooms');
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

	app.get('/rooms/:uid', function(req, res){
		var uid = req.params.uid;
		res.render('canvas', {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			roomId: uid
		});
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
		if(functions.validateBool(newData.isPublic) === true) {
			if(functions.countRoomsOwnerOf(ip, rooms) < 5) {
				var id = functions.generateId(rooms);
				// socket.handshake.address || socket.client.conn.remoteAddress || socket.conn.remoteAddress
	/*			var ip = req.socket.request.connection.remoteAddress;*/
				if(ip != null) {
					var newRoom = new functions.Room(id, ip, newData.isPublic);
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
}