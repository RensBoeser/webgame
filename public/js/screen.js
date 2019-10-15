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
	if (data.kind === "player") {
		document.getElementById(data.id).remove();
	}
});

socket.on("players", currentUsers => {
	users = currentUsers;

	list.innerHTML = users.map(user =>
		`<li><strong>[${user.id}]</strong> pos: (${user.position.x}, ${user.position.y}), mov: (${user.movement.x}, ${user.movement.y})</li>`
	).join("\n");

	users.forEach (user => {
		var element = document.getElementById(user.id);
		if (element) {
			if (element.style.left !== `${user.position.x}px` && element.style.top !== `${user.position.y}px`) {
				element.style.left = `${user.position.x}px`;
				element.style.top = `${user.position.y}px`;
			}
			const playerArrow = element.getElementsByClassName("player__arrow")[0];
			if (playerArrow) {
				const rotation = Math.atan2(user.movement.y, user.movement.x) - Math.PI * 0.5;
				const speed = Math.sqrt(Math.pow(user.movement.x, 2) + Math.pow(user.movement.y, 2));
				playerArrow.style.transform = `rotate(${rotation}rad)`;
				playerArrow.style.opacity = speed;
				playerArrow.style.height = `${Math.max(80 * speed, 40)}px`;
			}
		} else {
			console.log(`user with ID ${user.id} not in elements`);
			addPlayerToElements(user.id);
		}
	});
});

function addPlayerToElements(id) {
	game.innerHTML +=`
<div class="player" id="${id}">
 	<div class="player__title">${id}</div>
 	<div class="player__arrow"></div>
 </div>`;
}