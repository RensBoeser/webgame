import express from "express"
import socket from "socket.io"

import {Player, Point} from "./types"

// App setup
const app = express()
const server = app.listen(5000, () => {
	console.log("listening to requests on port 5000")
})

// Static files
app.use(express.static("public"))

// Variables
let currentUsers: Array<Player> = []

// Functions
const createPlayer = (id: string, name: string): Player => ({
	id,
	name,
	position: { x: 0, y: 0 },
	movement: { x: 0, y: 0 },
	secondsAlive: 0,
	kills: 0,
	score: 0
})

// Socket setup
const io = socket(server)

io.on("connection", socket => {
	console.log(`[${socket.id}] opened socket connection`)
	socket.on("identify", (data: {kind: string}) => {
		if (data.kind === "player") {
			// currentUsers.push(createPlayer(socket.id))
			io.sockets.emit("connected", {
				id: socket.id,
				kind: data.kind,
				currentUsers
			})
		}
		console.log(`[${socket.id}] identified as '${data.kind}'`)
	})

	socket.on("set-name", (data: {name: string}) => {
		if (data.name && data.name.length <= 24 && !currentUsers.find(user => user.name === data.name)) {
			currentUsers = currentUsers.filter(user => user.id !== socket.id)
			const player = createPlayer(socket.id, data.name)
			currentUsers.push(player)
			io.sockets.emit("joined", {player, currentUsers, id: socket.id})
			console.log(`[${socket.id}] set name to '${data.name}'`)
		} else {
			io.sockets.emit("set-name-failed", {name: data.name, id: socket.id})
		}
	})

	// Listen to events
	socket.on("movement", (movement: Point) => {
		const user = currentUsers.find(item => item.id === socket.id)
		if (user) {
			user.movement = movement
			user.position.x += movement.x * 4
			user.position.y += movement.y * 4
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
setInterval(() => currentUsers.map(user => user.secondsAlive++), 1000)
