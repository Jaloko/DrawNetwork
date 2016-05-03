/**
* Updates a room in the rooms table
*
* @param {Object} room A specific room object
* @param {Object} db Reference to the SQLite database functions
*/
module.exports.updateRoomInDB = function(room, db) {
	db.run('UPDATE rooms SET canvas = "' + room.storedCanvas + '", activity = ' + room.activity + ' WHERE id = "' + room.id + '"');
}

/**
* Deletes a room in the rooms table
*
* @param {Object} room A specific room object
* @param {Object} db Reference to the SQLite database functions
*/
module.exports.deleteRoomInDB = function(room, db) {
	db.run('DELETE FROM rooms WHERE id = "' + room.id + '"');
}

/**
* Updates all rooms in the rooms table
*
* @param {Array} room An array of room objects
* @param {Object} db Reference to the SQLite database functions
*/
module.exports.updateRoomsInDB = function(rooms, db) {
	// Assumes the rooms in db are the same as in memory - which they will be
	for(var r = 0; r < rooms.length; r++) {
		this.updateRoomInDB(rooms[r], db);
	}
}

/**
* Generates a unique id. 
* It is not possible for collisions as it checks if the id is already in use.
*
* @param {Array} room An array of room objects
* @return {String} Returns a unique string of random charactors
*/
module.exports.generateId = function(rooms){
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

/**
* Returns an id of a random socket id that is not the same as the input socket object
*
* @param {Object} room A specific room object
* @param {Object} socket A specific socket object
* @return {Number} Returns an id of a random socket id
*/
module.exports.pickRandom = function(room, socket) {
	var rand = Math.floor(Math.random() * (room.users.length - 1));
	if(socket.id == room.serverUsers[rand].id) {
		pickRandom(room, socket);
	} else {
		return rand;
	}
}

/**
* Returns an array index of a room
*
* @param {Object} socket A specific socket object
* @param {Array} rooms An array of room object
* @return {Number} Returns an array index of a room
*/
module.exports.getRoomIndex = function(socket, rooms) {
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].id in socket.rooms) {
			return i;
		}
	}
}

/**
* Returns a number of rooms an ip owns
*
* @param {String} ip An ip address
* @param {Array} rooms An array of room object
* @return {Number} Returns a number of rooms an ip owns
*/
module.exports.countRoomsOwnerOf = function(ip, rooms) {
	var counter = 0;
	for(var i = 0; i < rooms.length; i++) {
		if(rooms[i].owner === ip) {
			counter++;
		}
	}
	return counter;
}

/**
* Checks if a user is legitimately going offline.
* If they are it removes them from the rooms users list and emits the new data.
*
* @param {Object} room A specific room object
* @param {Object} newData The data sent from a client socket
* @param {Object} socket A socket object
* @param {Object} io Reference to the Socket.io functions
*/
module.exports.validateImOffline = function(room, newData, socket, io) {
	if(this.validateText(newData.name) && newData.name.length <= 30 && this.validateHex(newData.colour)) {
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

/**
* Converts a date object into a formatted date string
*
* @param {Object} date A date object. This parameter is optional
* @return {String} Returns a formatted date string
*/
module.exports.getDate = function(date) {
	var date = date || new Date();
	var month = ("0" + (date.getMonth() + 1)).slice(-2);
	var day = ("0" + date.getDate()).slice(-2);
	return date.getFullYear() + "-" + month + "-" + day;
}

/**
* Returns the number of days there are in a specific month
*
* @param {Object} date A date object
* @return {Number} Returns the number of days there are in a specific month
*/
module.exports.daysInMonth = function(date) {
	return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
}

/**
* Validates a string against a regex expression
*
* @param {String} text A text string
* @return {Boolean} Returns true or false
*/
module.exports.validateText = function(text) {
	if(new RegExp('^[A-Za-z0-9 ]+$').test(text)) {
		return true;
	} else {
		return false;
	}
}

/**
* Validates a hex string against a regex expression
*
* @param {String} hex A hex string
* @return {Boolean} Returns true or false
*/
module.exports.validateHex = function(hex) {
	if(new RegExp('^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$').test(hex)) {
		return true;
	} else {
		return false;
	}
}

/**
* Validates a number against a regex expression
*
* @param {String} number A number
* @return {Boolean} Returns true or false
*/
module.exports.validateNumber = function(number) {
	if(new RegExp('[0-9]').test(number)) {
		return true;
	} else {
		return false;
	}
}

/**
* Validates a boolean
*
* @param {String} bool A boolean
* @return {Boolean} Returns true or false
*/
module.exports.validateBool = function(bool) {
	if(bool === true || bool === false) {
		return true;
	} else {
		return false
	}
}

/**
* Hashes a password with a salt using sha256
*
* @param {String} password A string
* @param {String} salt A string of random charactors
* @param {Object} crypto A cryptographic library
* @return {String} Returns the hashed password
*/
module.exports.hashPassword = function(password, salt, crypto) {
	var hash = crypto.createHash('sha256');
	hash.update(password);
	hash.update(salt);
	return hash.digest('hex');
}

/**
* The room class acts as a container for room data
*
* @class Room
* @constructor
* @param {String} id A unique string
* @param {String} owner A string. Usually an ip address
* @param {Boolean} public Determines whether the room is public or not
*/
module.exports.Room = function(id, owner, public) {
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
