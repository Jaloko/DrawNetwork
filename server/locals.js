module.exports = function(app) {	
	/**
	* Converts a time integer in seconds to a more legible string format for public viewing
	*
	* @param {Number} time A timestamp in seconds
	* @return {String} Returns a formatted string
	*/
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
}