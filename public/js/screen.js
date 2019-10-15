// Socket setup
const socket = io.connect("http://localhost:4000/");

// Client registration
socket.emit("identify", {
	identity: "screen"
});

// Query DOM
const list = document.getElementById("player-list");

// Listen to events
socket.on("connected", data => {
	// New connection (data: {kind: string, id: string, currentUsers: Array<Player>})

});

socket.on("disconnected", data => {
	// Removed connection (data: {kind: string, id: string, currentUsers: Array<Player>})

});

socket.on("players", currentUsers => {
	const listedUsers = currentUsers.map(item =>
		`<li><strong>[${item.id}]</strong> pos: (${item.position.x}, ${item.position.y}), mov: (${item.movement.x}, ${item.movement.y})</li>`
	)

	list.innerHTML = listedUsers.join("\n");
});
