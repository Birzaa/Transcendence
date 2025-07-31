const onlineUsers = new Set<string>();

export function markUserOnline(userId: string) {
	onlineUsers.add(userId);
}

export function markUserOffline(userId: string) {
	onlineUsers.delete(userId);
}

export function isUserOnline(userId: string): boolean {
	return onlineUsers.has(userId);
}

export function getOnlineUsers(): Set<string> {
	return onlineUsers;
}
