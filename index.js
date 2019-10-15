var express = require("express");
var socket = require("socket.io");

// App setup
var app = express();
var server = app.listen(5000, () => {
	console.log("listening to requests on port 5000");
});

// Static files
app.use(express.static("public"))

// Variables
var currentUsers = [];

// Socket setup
var io = socket(server);

io.on("connection", socket => {
	currentUsers.push(socket.id);
	io.sockets.emit("connected", {
		id: socket.id,
		currentUsers: currentUsers
	});
	console.log("opened socket connection", socket.id);

	socket.on("disconnect", _ => {
		currentUsers = currentUsers.filter(item => item != socket.id);
		io.sockets.emit("disconnected", {
			id: socket.id,
			currentUsers: currentUsers
		});
		console.log("closed socket connection", socket.id);
	});
});