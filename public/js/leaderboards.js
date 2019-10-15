// Socket setup
const socket = io.connect();

// Client registration
socket.emit("identify", {
	kind: "leaderboard"
});

// Variables
const users = [];

// Query DOM
const leaderboardTitle = document.getElementById("title");
const leaderboardContent = document.getElementById("leaderboard-content");

// Functions
function selectLeaderboard(leaderboard) {
	let title = "";

	switch (leaderboard) {
		case "time":
			title = "Longest alive";
			break;
		case "suicides":
			title = "most suicides";
			break;
		case "hits":
			title = "most hits";
			break;
		case "kills":
		default:
			title = "most kills";
	}
	leaderboardTitle.innerHTML = title;
}

// Listen to events
socket.on("players", currentUsers => {
	users = currentUsers;
});