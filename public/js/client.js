// Socket setup
var socket = io.connect();

// // Query DOM
// var message = document.getElementById("message");
// var handle = document.getElementById("handle");
// var button = document.getElementById("send");
// var log = document.getElementById("log");
// var userLog = document.getElementById("current-users");

// // Variables
// var currentUsers = [];

// // Add events
// button.addEventListener("click", () => {
// 	socket.emit("message", {
// 		 message: message.value,
// 		 handle: handle.value
// 	});
// });

// // Listen for events
// socket.on("message", data => {
// 	log.innerHTML += `<p><strong>${data.handle}</strong> ${data.message}</p>`;
// });

// socket.on("connected", data => {
// 	currentUsers = data.currentUsers;
// 	userLog.innerHTML = `Users online (${data.currentUsers.length}): ${data.currentUsers.join(", ")}`;
// });

// socket.on("disconnected", data => {
// 	currentUsers = data.currentUsers;
// 	userLog.innerHTML = `Users online (${data.currentUsers.length}): ${data.currentUsers.join(", ")}`;
// });