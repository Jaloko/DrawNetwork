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
	}
}

function checkPageState() {
	if(getURLParam('room') != null) {
		var home = document.getElementById('home-content');
		home.className = "invisible";
	} else {
		var drawContent = document.getElementById('draw-content');
		drawContent.className = "invisible";
	}
}