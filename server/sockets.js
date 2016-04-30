module.exports = function(io, db, rooms, functions) {
	// Ensures the client cannot update their colour too often.
	var timer = new Date().getTime();
	// Allows each room to save all room data to the database every second just in case the server goes offline
	var saveRoomsTimer = new Date().getTime();
	var finalSaveRooms = false;

	io.sockets.on('connection', function(socket) {

		/**
		* Received from the client after the 'submit name' button is clicked.
		* First validates the incomming room id and then joins the room allocated to that id.
		*/
		socket.on('join room', function(data) {
			var newData = {
				id: data,
			};
			if(functions.validateText(newData.id)) {
				if(socket.rooms.length <= 1) {
					socket.join(newData.id);
				}
			}
		});

		/**
		* Received from the client after the 'submit name' button is clicked. Is Sent after
		* the 'join room' transmission has been sent.
		* First validates the incomming room id, client name and colour. If the chosen name isn't taken
		* it allows the client to proceed to the room.
		*/
		socket.on('im online', function(data) {
			var newData = {
				id: data.id,
				name: data.name,
				colour : data.colour
			};
			var index;
			// Validate room id
			if(functions.validateText(newData.id)) {
				index = functions.getRoomIndex(socket, rooms);
			}
			if(index != null) {
				// Validate client name and colour
				if(functions.validateText(newData.name) && newData.name.length <= 20 && functions.validateHex(newData.colour)) {
					// Check that the room is not full
					if(rooms[index].users.length < 10) {
						var counter = 0;
						for(var i = 0; i < rooms[index].users.length; i++) {
							if(rooms[index].users[i] != null) {
								if(rooms[index].users[i].name === newData.name) {
									counter++;
								}
							}
						}
						// Proceed if the client name is not already taken
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

		/**
		* Received from the client on canvas page load.
		* Validates that the room id the client is attempting to connect to exists.
		*/
		socket.on('does room exist', function(data) {
			var newData = {
				id: data,
			};
			// Validate room id
			if(functions.validateText(newData.id)) {
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

		/**
		* Received after the client has been validated and can join the room.
		* If the room contains users picks a random user to send their canvas data.
		* If the room contains 0 users send the canvas data the server has.
		*/
		socket.on('sync', function() {
			var index = functions.getRoomIndex(socket, rooms);
			if(index != null) {
				if(rooms[index].users.length >= 2) {
					for(var i = 0; i < rooms[index].serverUsers.length; i++) {
						if(rooms[index].serverUsers[i].id == socket.id) {
							if(rooms[index].serverUsers[i].hasSynced != true) {
								var rand = functions.pickRandom(rooms[index],socket);
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
			}
		});

		/**
		* Received after the server requests the client to send canvas.
		* Takes the received canvas data and sends it to the joining client.
		*/
		socket.on('receive canvas', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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

		/**
		* Received when the client changes their colour.
		* Validates the colour and then sends that colour to all clients in the same room.
		*/
		socket.on('update colour', function(data) {
			if(new Date().getTime() > timer + 100) {
				timer = new Date().getTime();
				if(functions.validateHex(data)) {
					var index = functions.getRoomIndex(socket, rooms);
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

		/**
		* Received when the client draw with the regular brush on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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
				if(functions.validateText(newData.name) && newData.name.length <= 30 && functions.validateHex(newData.colour)
					&& functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.lastX)
					&& functions.validateNumber(newData.lastY) && functions.validateNumber(newData.size)
					&& newData.size > 0 && newData.size <= 100) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the text tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw text', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				x: data.x,
				y: data.y,
				font: data.font,
				colour: data.colour,
				text: data.text
			};
			if(index != null) {
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateHex(newData.colour)
					&& functions.validateText(newData.font) && functions.validateText(newData.text)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw text', newData);
						}
					}
				}
			}

		});

		/**
		* Received when the client uses the rectangle shape tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw rect', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				x: data.x,
				y: data.y,
				endX: data.endX,
				endY: data.endY,
				colour: data.colour
			};
			if(index != null) {
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.endX) 
					&& functions.validateNumber(newData.endY) && functions.validateHex(newData.colour)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw rect', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the circle shape tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw circle', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				x: data.x,
				y: data.y,
				endX: data.endX,
				endY: data.endY,
				colour: data.colour
			};
			if(index != null) {
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.endX) 
					&& functions.validateNumber(newData.endY) && functions.validateHex(newData.colour)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw circle', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the pentagon shape tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw pentagon', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				x: data.x,
				y: data.y,
				endX: data.endX,
				endY: data.endY,
				colour: data.colour
			};
			if(index != null) {
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.endX) 
					&& functions.validateNumber(newData.endY) && functions.validateHex(newData.colour)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw pentagon', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the hexagon shape tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw hexagon', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				x: data.x,
				y: data.y,
				endX: data.endX,
				endY: data.endY,
				colour: data.colour
			};
			if(index != null) {
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.endX) 
					&& functions.validateNumber(newData.endY) && functions.validateHex(newData.colour)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw hexagon', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the line tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw line', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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
				if(functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.endX) 
					&& functions.validateNumber(newData.endY) && functions.validateText(newData.lineTip) && functions.validateNumber(newData.size)
					 && functions.validateHex(newData.colour) && newData.size > 0 && newData.size <= 100) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw line', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the eraser tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('erase', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				name: data.name,
				x: data.x,
				y: data.y,
				lastX: data.lastX,
				lastY: data.lastY,
				size: data.size
			};
			if(index != null) {
				if(functions.validateText(newData.name) && newData.name.length <= 30
					&& functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.lastX)
					&& functions.validateNumber(newData.lastY) && functions.validateNumber(newData.size) && newData.size > 0 && newData.size <= 100) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync erase', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client uses the square brush tool on the canvas.
		* Validates all incomming data and then emits that data to all clients in the same room.
		*/
		socket.on('draw square', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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
				if(functions.validateText(newData.name) && newData.name.length <= 30
					&& functions.validateNumber(newData.x) && functions.validateNumber(newData.y) && functions.validateNumber(newData.lastX)
					&& functions.validateNumber(newData.lastY) && functions.validateNumber(newData.size) && newData.size > 0 && newData.size <= 100
					&& functions.validateHex(newData.colour)) {
					if(rooms[index].users != null) {
						if(rooms[index].clearVote.vote == false) {
							socket.broadcast.to(rooms[index].id).emit('sync draw square', newData);
						}
					}
				}
			}
		});

		/**
		* Received when the client sends a chat message.
		* Validates the message and then emits that message to all clients in the same room.
		*/
		socket.on('chat message', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			var newData = {
				name: data.name,
				message: data.message
			};
			if(index != null) {
				if(functions.validateText(newData.name) && functions.validateText(newData.message) && newData.message.length <= 300 &&
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

		/**
		* Received when the client initiates a clear canvas vote.
		* Starts the room vote timer and then emits to all clients that a vote is happening.
		*/
		socket.on('vote clear', function() {
			var index = functions.getRoomIndex(socket, rooms);
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

		/**
		* Received when the client clicks 'yes' or 'no' on the voting screen.
		* Validates the incomming data and applys the vote data to the room.
		*/
		socket.on('receive clear vote', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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
								// Ensure that user cannot vote again
								rooms[index].serverUsers[i].hasVoted = true;
								break;
							}
						}
					}
				}
			}
		});

		/**
		* Received when the client leaves the canvas page.
		* Validates the incomming data and then removes the user from the room.
		*/
		socket.on('im offline', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			if(index != null) {
				var newData = {
					name: data.name,
					colour : data.colour
				};
				functions.validateImOffline(rooms[index], newData, socket, io);
				rooms[index].activity = new Date().getTime();
			}
		});

		/**
		* Received when the client leaves the canvas page and is the last user in the room.
		* Validates the incomming data, removes the user from the room and then stores the clients canvas data.
		*/
		socket.on('im offline store canvas', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
			if(index != null) {
				var newData = {
					name: data.name,
					colour: data.colour,
					canvas: data.canvas
				};
				functions.validateImOffline(rooms[index], newData, socket, io);
				rooms[index].activity = new Date().getTime();
				if(rooms[index].users.length <= 0) {
					if(newData.canvas.length <= 9999999) {
						rooms[index].storedCanvas = newData.canvas;
					}
				}
			}
		});

		/**
		* Received when the client clicks the 'save room' button.
		* Validates the incomming data and then stores the clients canvas data.
		*/
		socket.on('store canvas', function(data) {
			var index = functions.getRoomIndex(socket, rooms);
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
					functions.deleteRoomInDB(i, db);
					rooms.splice(i, 1);
					continue;
				}
			}
			if(rooms[i].clearVote.vote == true) {
				if(rooms[i].clearVote.timeRemaining > 0 && rooms[i].clearVote.yes < Math.floor(rooms[i].clearVote.total / 2) + 1 &&
				rooms[i].clearVote.total - rooms[i].clearVote.no >= Math.floor(rooms[i].clearVote.total / 2) + 1 && 
				rooms[i].clearVote.yes + rooms[i].clearVote.no < rooms[i].clearVote.total) {
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
						io.sockets.in(rooms[i].id).emit('receive clear canvas');
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
				functions.updateRoomsInDB(rooms, db);
			}
		} else{
			if(finalSaveRooms === true) {
				finalSaveRooms = false;
				functions.updateRoomsInDB(rooms, db);
			}
		}

	}, 1);
}