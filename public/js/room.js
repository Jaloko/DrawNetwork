var Room = function(){
	this.searchRoom = function() {
		var table = document.getElementById('room-list');
		var tbody = table.getElementsByTagName('tbody')[0]
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
}