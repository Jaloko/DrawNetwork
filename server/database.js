module.exports = function(db, crypto, rooms, functions) {
	/**
	* SQLite3 is asynchronous so this function call forces each database
	* query to execute one at a time.
	*/
	db.serialize(function() {
		/**
		* Create the database tables if they don't exist
		*/
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

		db.run('CREATE TABLE IF NOT EXISTS visitors(' +
				'id integer PRIMARY KEY NOT NULL,' +
				'date date UNIQUE NOT NULL,' +
				'unique_visitors integer NOT NULL,' +
				'total_page_hits integer NOT NULL' +
				')');

		/**
		* Creates the default admin account
		*/
		var defaultAdminPassword = "admin215";
		var salt = String(crypto.randomBytes(16));
		var passwordHash = functions.hashPassword(defaultAdminPassword, salt, crypto);
		db.run('INSERT OR IGNORE INTO users(id, username, password, salt, administrator) VALUES(1, "admin", "' + passwordHash + '", "' + salt + '", 1)');

		/**
		* Queries the rooms table to check if it already contains any data.
		* If the rooms table does contain data it will load this into memory
		* ready for the application to use.
		*/
		db.get('SELECT COUNT(*) AS rows FROM rooms', function(err, row) {
			// rooms table does not contain any data
			if(row.rows == 0) {
				var newRoom = new functions.Room(functions.generateId(rooms), "admin", true);
				rooms.push(newRoom);
				db.run('INSERT OR IGNORE INTO rooms(id, owner, public, activity) VALUES("' + newRoom.id + '", "' + newRoom.owner + '", ' + (newRoom.public ? 1 : 0) + ', ' + newRoom.activity + ')');
				console.log("No rooms in database, created new room.");
			} 
			// rooms table does contain data
			else {
				var counter = 0;
				db.each('SELECT * FROM rooms', function(err, row) {
					var oldRoom = new functions.Room(row.id, row.owner, row.public == 1 ? true : false);
					oldRoom.storedCanvas = row.canvas;
					oldRoom.activity = row.activity;
					rooms.push(oldRoom);
					counter++;
				}, function() {
					console.log("Successfully loaded " + counter + " room(s) from the database.");
				});
			}
		});

		/**
		* Queries the visitors table to check if it already contains any data.
		*/
		db.get('SELECT COUNT(*) AS rows FROM visitors', function(err, row) {

			if(row.rows == 0) {
				db.run("INSERT OR IGNORE INTO visitors(id, date, unique_visitors, total_page_hits) VALUES(NULL, date('now'), 0, 0)");
			} else {
				//Generate test analytic data
				/*var date = new Date("01-02-2016");
				for(var i = 0; i < 200; i++) {
					db.run("INSERT OR IGNORE INTO visitors(id, date, unique_visitors, total_page_hits) VALUES(NULL,'" + functions.getDate(date) + "'," + Math.floor(Math.random() * 10) + ", 0)");
					date.setDate(date.functions.getDate() +1);
				}*/
			}
		});

	});
}