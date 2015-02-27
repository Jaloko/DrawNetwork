// Typical globals
var usersOnlineTab = document.getElementById('users-online-tab');
var usersChatTab = document.getElementById('users-chat-tab');

// Onclick
usersOnlineTab.onclick = function() {
	usersOnlineTab.className = "tab selected";
	usersChatTab.className = "tab";
	var usersOnline = document.getElementById('users-online');
	usersOnline.className = "visible";
	var usersChat = document.getElementById('users-chat');
	usersChat.className = "invisible";
	clearUserCounter();
};
usersChatTab.onclick = function() {
	usersChatTab.className = "tab selected";
	usersOnlineTab.className = "tab";
	var usersChat = document.getElementById('users-chat');
	usersChat.className = "visible";
	var usersOnline = document.getElementById('users-online');
	usersOnline.className = "invisible";
	clearChatNotifs();
};