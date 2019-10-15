import express from "express"
import socket from "socket.io"

import {Player} from "./types"

// App setup
const app = express()
const server = app.listen(4000, () => {
	console.log("listening to requests on port 4000")
})

// Static files
app.use(express.static("public"))

// Variables
let currentUsers: Array<Player> = []

// Functions
const createPlayer = (id: string): Player => ({
	id,
	position: { x: 0, y: 0 },
	movement: { x: 0, y: 0 }
})

// Socket setup
const io = socket(server)

io.on("connection", socket => {
	console.log(`[${socket.id}] opened socket connection`)
	socket.on("identify", data => {
		if (data.identity === "player") {
			currentUsers.push(createPlayer(socket.id))
			io.sockets.emit("connected", {
				id: socket.id,
				kind: data.identity,
				currentUsers
			})
		}
		console.log(`[${socket.id}] identified as '${data.identity}'`)
	})

	// Listen to events
	socket.on("movement", movement => {
		const user = currentUsers.find(item => item.id === socket.id)
		if (user) {
			user.movement = movement
		}
	})

	socket.on("disconnect", _ => {
		const user = currentUsers.find(item => item.id === socket.id)
		currentUsers = currentUsers.filter(item => item.id !== socket.id)
		io.sockets.emit("disconnected", {
			id: socket.id,
			currentUsers,
			kind: user ? "player" : "screen"
		})
		console.log(`[${socket.id}] closed socket connection`)
	})
})

setInterval(() => io.emit("players", currentUsers), 16)
