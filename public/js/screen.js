// Socket setup
const socket = io.connect();

// Client registration
socket.on("connect", () => {
	playerCanvas.innerHTML = "";
	socket.emit("identify", {
		kind: "screen"
	});
});

// Query DOM
const listHeader = document.getElementById("player-list-header");
const list = document.getElementById("player-list");
const game = document.getElementById("game");
const playerCanvas = document.getElementById("players");
const deadCanvas = document.getElementById("dead");
let loaded = false;

let svgs = [];
["poppetje_stil.svg", "poppetje_punch1.svg", "poppetje_punch2.svg", "poppetje_punch3.svg", "poppetje_punch4.svg"].forEach((name, index, array) =>
	fetch(`/svg/${name}`)
		.then(r => r.text())
		.then(t => {
			svgs = [...svgs, t];
			if (index >= array.length - 1) {
				loaded = true;
			}
		})
);
	


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
	let player = document.getElementById(playerId);
	if (player) {
		// Remove arrow
		const arrow = player.getElementsByClassName("player__arrow")[0]
		if (arrow) {
			arrow.style.display = "none";
		}
		
		// Remove player when death transition ends
		// const removePlayer = () => {
		// player = document.getElementById(player.id);
		if (player && player.parentNode) {
			player.parentNode.removeChild(player);
			player = deadCanvas.appendChild(player);
		}
		// }

		const removePlayer = () => {
			if (player && player.parentNode) {
				player.parentNode.removeChild(player)
			}
		}

		player.addEventListener("transitioncancel", removePlayer);
		player.addEventListener("transitionend", removePlayer);

		// Add death transition
		setTimeout(() => {
			player.style.transform = "scale(0)";
		}, 20);

	}
});

socket.on("punch", data => {
	// data: {player: Player, target: Player}
	const playerElement = document.getElementById(data.player.id);
	if (playerElement) {
		const svgElements = playerElement.getElementsByTagName("svg")
		if (svgElements.length) {
			for (let i = 1; i < svgs.length; i++) {
				setTimeout(() => {
					svgElements[0].remove();
					playerElement.innerHTML += svgs[i];
				}, i * 20);
				setTimeout(() => {
					svgElements[0].remove();
					playerElement.innerHTML += svgs[0];
				}, svgs.length * 20)
			}
		}
	}
})

socket.on("players", currentUsers => {
	if (loaded) {
		// List players
		listHeader.innerText = `Leaderboard (${currentUsers.length})`
		list.innerHTML = currentUsers.map(user =>
			`<li class="c${user.color}"><strong>${user.name}</strong><span>${user.score}</span></li>`
		).join("\n");
	
		// Handle player gameobjects
		currentUsers.forEach((user, index) => {
			var element = document.getElementById(user.id);
			if (element) {
				element.style.left = `${user.position.x}px`;
				element.style.top = `${user.position.y}px`;
				
				if (user.movement.x > 0) {
					element.classList.add("moving-right");
				} else {
					element.classList.remove("moving-right");
				}

				const playerArrow = element.getElementsByClassName("player__arrow")[0];
				if (playerArrow) {
					const speed = Math.sqrt(Math.pow(user.movement.x, 2) + Math.pow(user.movement.y, 2));
					playerArrow.style.transform = `rotate(${user.direction - Math.PI * 0.5}rad)`;
					playerArrow.style.opacity = speed;
					playerArrow.style.height = `${Math.max(80 * speed, 40)}px`;
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
	}
});

async function addPlayerToElements(player) {
	playerCanvas.innerHTML += `
	<div class="player c${player.color}" id="${player.id}" style="left: ${player.position.x}; top: ${player.position.y}">
		${svgs[0]}
		<div class="player__title"><div class="player__crown"></div>${player.name}</div>
		<div class="player__arrow arrow"></div>
	</div>`;
}
