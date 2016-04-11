module.exports = function(app, db, crypto, passport, functions) {
	var passportLocal = require('passport-local');
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var expressSession = require('express-session');

	app.use(bodyParser.urlencoded( { extended: true } ));
	app.use(bodyParser.json());
	app.use(cookieParser());

	/**
	* Sets a uniqueId cookie if the client does not already have it.
	* Also handles the websites analytics
	*/
	app.use(function (req, res, next) {
		// Check if client sent cookie
		var cookie = req.cookies.uniqueId;
		if (cookie === undefined)
		{
			// Generate a unique cookie. Only possible collision is if generated at the exact same time
			var randomNumber=Math.random().toString() + Date.now();
			randomNumber=randomNumber.substring(2,randomNumber.length);
			res.cookie('uniqueId',randomNumber, { expires: false, httpOnly: true });

			// Update analytics database
			var currentDate = functions.getDate();
			db.get('SELECT * FROM visitors WHERE date = ?', currentDate, function(err, row) {
				if(row != undefined) {
					db.run('UPDATE visitors SET unique_visitors = ' + (row.unique_visitors + 1) + ', total_page_hits = ' + (row.total_page_hits + 1) + ' WHERE date = "' + row.date + '"');
				} else {
					db.run("INSERT OR IGNORE INTO visitors(id, date, unique_visitors, total_page_hits) VALUES(null, date('now'), 0, 0)");
					db.run('UPDATE visitors SET unique_visitors = ' + 1 + ', total_page_hits = ' + 1 + ' WHERE date = "' + currentDate + '"');
				}
			});
		} 
		else
		{
			// Update analytics database
			var currentDate = functions.getDate();
			db.get('SELECT * FROM visitors WHERE date = ?', currentDate, function(err, row) {
				if(row != undefined) {
					db.run('UPDATE visitors SET total_page_hits = ' + (row.total_page_hits + 1) + ' WHERE date = "' + row.date + '"');
				} else {
					db.run("INSERT OR IGNORE INTO visitors(id, date, unique_visitors, total_page_hits) VALUES(null, date('now'), 0, 0)");
					db.run('UPDATE visitors SET total_page_hits = ' + 1 + ' WHERE date = "' + currentDate + '"');
				}
			});
		} 
		next();
	});
	
	/**
	* Sets up a session system so that passport can keep the user logged in
	*/
	app.use(expressSession( { 
		secret: process.env.SESSION_SECRET || 'secret',
		resave: false,
		saveUninitialized: false
	}));

	/**
	* Sets up passport so it is ready for the custom middleware
	*/
	app.use(passport.initialize());
	app.use(passport.session());

	/**
	* Custom passport middleware
	*/
	passport.use(new passportLocal.Strategy(function(username, password, done) {
		db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
		if (!row) return done(null, false);
		var hash = functions.hashPassword(password, row.salt, crypto);
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
}