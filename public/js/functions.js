function selectElement(ele) {
	var temp = document.getElementById(ele.id + "-radio");
	temp.checked = true;
	var tableRows = document.getElementById("rooms").rows;
	for(var i = 1; i < tableRows.length; i++) {
		for(var ii = 0; ii < tableRows[i].cells.length; ii++) {
			tableRows[i].cells[ii].className = "";
		}
	}
	for(var i = 0; i < ele.cells.length; i++) {
		ele.cells[i].className = "row-selected";
	}
}

var selectedRoom;
function selectACPElement(ele) {
	var temp = document.getElementById(ele.id + "-radio");
	temp.checked = true;
	var tableRows = document.getElementById("rooms").rows;
	for(var i = 0; i < tableRows.length; i++) {
		for(var ii = 0; ii < tableRows[i].cells.length; ii++) {
			tableRows[i].cells[ii].className = "";
		}
	}
	for(var i = 0; i < ele.cells.length; i++) {
		ele.cells[i].className = "row-selected";
	}
	selectedRoom = ele.id;

	var allUsers = document.getElementById('room-users');
	for(var au = 1; au < allUsers.rows.length; au++) {
		if(allUsers.rows[au].id === ele.id) {
			allUsers.rows[au].className = "";
		} else {
			allUsers.rows[au].className = "Invisible";
		}
	}
}

function redirectToRoom() {
	if(selectedRoom == null) {
		var tableRows = document.getElementById("rooms").rows;
		selectedRoom = tableRows[1].id;
	}
	location.href = '/rooms/' + selectedRoom;
}

function searchRoom() {
	var table = document.getElementById('rooms');
	var tbody = table.getElementsByTagName('tbody')[0];
	var row = tbody.rows;
	var roomSearch = document.getElementById('room-search');
	for(var i = 0; i < row.length; i++) {
		row[i].className = "";
		if(roomSearch.value != "") {
			if(row[i].cells[0].innerHTML.indexOf(roomSearch.value) == -1) {
			 	row[i].className = "invisible";
			}
		}
	}
}

function joinRoom() {
	var radios = document.getElementsByName("rooms");
	var radioId = "";
	for(var i = 0; i < radios.length; i++) {
		if(radios[i].checked) {
			radioId = radios[i].id;
			break;
		}
	}
	var roomId = radioId.split("-");
	document.location.href = document.location.href + "/" + roomId[0];
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