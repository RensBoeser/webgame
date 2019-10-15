import express from "express"
import socket from "socket.io"

// App setup
const app = express()
const server = app.listen(5000, () => {
	console.log("listening to requests on port 5000")
})

// Static files
app.use(express.static("public"))

// Variables
let currentUsers: Array<string> = []

// Socket setup
const io = socket(server)

io.on("connection", socket => {
	currentUsers.push(socket.id)
	io.sockets.emit("connected", {
		id: socket.id,
		currentUsers
	})
	console.log("opened socket connection", socket.id)

	socket.on("disconnect", _ => {
		currentUsers = currentUsers.filter(item => item !== socket.id)
		io.sockets.emit("disconnected", {
			id: socket.id,
			currentUsers
		})
		console.log("closed socket connection", socket.id)
	})
})
