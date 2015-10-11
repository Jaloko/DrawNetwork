function getURLParam(name) {
 	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

function insertURLParam(key, value) {
    key = escape(key); value = escape(value);

    var kvp = document.location.search.substr(1).split('&');
    if (kvp == '') {
        document.location.search = '?' + key + '=' + value;
    }
    else {

        var i = kvp.length; var x; while (i--) {
            x = kvp[i].split('=');

            if (x[0] == key) {
                x[1] = value;
                kvp[i] = x.join('=');
                break;
            }
        }

        if (i < 0) { kvp[kvp.length] = [key, value].join('='); }

        //this will reload the page, it's likely better to store this until finished
/*            document.location.search = kvp.join('&');*/
    }
}

function checkHomeState() {
	if(getURLParam('room') != null) {
		var home = document.getElementById('home-content');
		home.className = "invisible";
        document.getElementById('save-room').className = "nav-opt save";
	}
}

function checkPageState() {
	if(getURLParam('room') != null) {
		var home = document.getElementById('home-content');
		home.className = "invisible";
        var drawContent = document.getElementById('draw-content');
        drawContent.className = "";
        return true;
	} else {
		var drawContent = document.getElementById('draw-content');
		drawContent.className = "invisible";
        return false;
	}
}

// Is located in app.js as well - duplicated code
function convertTime(time) {
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