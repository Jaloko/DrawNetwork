// Public Functions

window.onload = function() {
	const rows = document.querySelectorAll(".room-item");
	rows.forEach(element => {
		element.addEventListener('click', () => {
			selectElement(element);
		});
	});
	
	const joinButton = document.querySelector('.join-btn');

	if(joinButton){
		joinButton.addEventListener('click', () => joinRoom());
	}
	
	
	// search event
	const searchButton = document.querySelector(".search-btn");
	if(searchButton) {
		searchButton.addEventListener('click', () => searchRoom());
	}
	
	const searchBox = document.querySelector("#room-search");
	if(searchBox) {
		searchBox.addEventListener('keyup', e => searchRoom());
		searchBox.addEventListener('keydown', e => searchRoom());
	}
};




export function selectElement(ele) {
	var temp = document.getElementById(ele.id + "-radio");
	temp.checked = true;
	var tableRows = document.getElementById("rooms").rows;
	for(var i = 1; i < tableRows.length; i++) {
		tableRows[i].className = "";
	}
	ele.className = "row-selected";
}

var selectedRoom;
export function selectACPElement(ele) {
	var temp = document.getElementById(ele.id + "-radio");
	temp.checked = true;
	var tableRows = document.getElementById("rooms").rows;
	for(var i = 0; i < tableRows.length; i++) {
		tableRows[i].className = "";
	}
	ele.className = "row-selected";
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

export function redirectToRoom() {
	if(selectedRoom == null) {
		var tableRows = document.getElementById("rooms").rows;
		selectedRoom = tableRows[1].id;
	}
	location.href = getBaseURL() + '/rooms/' + selectedRoom;
}

export function searchRoom() {
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

export function joinRoom() {
	var radios = document.getElementsByName("rooms");
	var radioId = "";
	for(var i = 0; i < radios.length; i++) {
		if(radios[i].checked) {
			radioId = radios[i].id;
			break;
		}
	}
	var roomId = radioId.split("-");
	document.location.href = getBaseURL() + '/rooms/' + roomId[0];
}

// Private Functions
export function getBaseURL() {
	var pathArray = document.location.href.split( '/' );
	var protocol = pathArray[0];
	var host = pathArray[2];
	return protocol + '//' + host;
}