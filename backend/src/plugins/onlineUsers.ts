export let onlineUsers = [];

export function setOnlineUsers(users) {
	onlineUsers = users;
}

export function isUserOnline(username) {
	return onlineUsers.includes(username);
}
