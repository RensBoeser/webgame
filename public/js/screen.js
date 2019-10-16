// Socket setup
const socket = io.connect();

// Client registration
socket.emit("identify", {
	kind: "screen"
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

socket.on("joined", data => {
	// New player joined (data: {player: Player, currentUsers: Array<Player>})
});

socket.on("disconnected", data => {
	// Removed connection (data: {kind: string, id: string, currentUsers: Array<Player>})
	if (data.kind === "player") {
		document.getElementById(data.id).remove();
	}
});

socket.on("dead", playerId => {
	const player = document.getElementById(playerId);
	if (player) {
		player.style.transition = "top 2s, left 2s, width 2s, height 2s"
		player.style.top = parseInt(player.style.top) + 50
		player.style.left = parseInt(player.style.left) + 50
		player.style.width = "0px";
		player.style.height = "0px";
		setTimeout(() => player.remove(), 1500);
	}
	
});

socket.on("players", currentUsers => {
	users = currentUsers;

	// List players
	list.innerHTML = users.map(user =>
		`<li><strong>${user.name}</strong> Time alive: ${user.secondsAlive}s, Kills: ${user.kills}</li>`
	).join("\n");

	users.sort((a, b) => a.score > b.score ? 1 : a.score < b.score ? -1 : 0);

	// Handle player gameobjects
	users.forEach((user, index) => {
		var element = document.getElementById(user.id);
		if (element) {
			// if (element.style.left !== `${user.position.x}px` && element.style.top !== `${user.position.y}px`) {
			element.style.left = `${user.position.x}px`;
			element.style.top = `${user.position.y}px`;
			// }

			const playerArrow = element.getElementsByClassName("player__arrow")[0];
			if (playerArrow) {
				const speed = Math.sqrt(Math.pow(user.movement.x, 2) + Math.pow(user.movement.y, 2));
				playerArrow.style.transform = `rotate(${user.direction - Math.PI * 0.5}rad)`;
				if (user.canAttack.length) {
					playerArrow.style.opacity = 1;
					playerArrow.style.height = `${Math.max(80 * speed, 60)}px`;

					playerArrow.classList.add("player__arrow-red");
				} else {
					playerArrow.style.opacity = speed;
					playerArrow.style.height = `${Math.max(80 * speed, 40)}px`;
					
					playerArrow.classList.remove("player__arrow-red");
				}
			}

			const playerCrown = element.getElementsByClassName("player__crown")[0];
			if (playerCrown) {

				switch (index) {
					case 0: playerCrown.classList.add("crown-gold"); playerCrown.classList.remove("crown-silver", "crown-bronze"); break;
					case 1: playerCrown.classList.add("crown-silver"); playerCrown.classList.remove("crown-gold", "crown-bronze"); break;
					case 2: playerCrown.classList.add("crown-bronze"); playerCrown.classList.remove("crown-gold", "crown-silver"); break;
					default: playerCrown.classList.remove("crown-gold", "crown-silver", "crown-bronze"); break;
				}
			}
		} else {
			console.log(`user with ID '${user.id}' not in elements`);
			addPlayerToElements(user);
		}
	});
});

function addPlayerToElements(player) {
	game.innerHTML +=`
<div class="player" id="${player.id}" style="left: ${player.position.x}; top: ${player.position.y}">
 	<div class="player__title"><div class="player__crown"></div>${player.name}</div>
 	<div class="player__arrow arrow"></div>
 </div>`;
}