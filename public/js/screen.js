// Socket setup
const socket = io.connect();

// Client registration
socket.emit("identify", {
	identity: "screen"
});

// Query DOM
const list = document.getElementById("player-list");
const game = document.getElementById("game");

// Variables
let users = [];

// Listen to events
socket.on("connected", data => {
	// New connection (data: {kind: string, id: string, currentUsers: Array<Player>})

});

socket.on("disconnected", data => {
	// Removed connection (data: {kind: string, id: string, currentUsers: Array<Player>})

});

socket.on("players", currentUsers => {
	users = currentUsers;

	list.innerHTML = users.map(user =>
		`<li><strong>[${user.id}]</strong> pos: (${user.position.x}, ${user.position.y}), mov: (${user.movement.x}, ${user.movement.y})</li>`
	).join("\n");

	game.innerHTML = users.map(user => `<div class="player" id="${user.id}" style="top: ${user.position.y}px; left: ${user.position.x}px;"><div class="player__title">${user.id}</div></div>`).join("\n");
	
});