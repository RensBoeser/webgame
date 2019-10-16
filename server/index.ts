import express from "express"
import socket from "socket.io"

import {Player, Point} from "./types"
import {updateCanAttack, updatePoints, updateDead} from "./update"

// App setup
const app = express()
const server = app.listen(4000, () => {
	console.log("listening to requests on port 5000")
})

// Static files
app.use(express.static("public"))

// Variables
let currentUsers: Array<Player> = []

// Functions
const createPlayer = (id: string, name: string, startPosition: { x: number, y: number }): Player => ({
	id,
	name,
	position: startPosition,
	movement: { x: 0, y: 0 },
	velocity: { x: 0, y: 0 },
	arrowPosition: { x: 0, y: 0 },
	direction: 0,
	attack: false,
	canAttack: [],
	secondsAlive: 0,
	kills: 0,
	score: 0
})

const update = () => {
	const playerRadius = 150
	const arrowRadius = 150
	const arrowHeight = 80

	// Update player values
	currentUsers = updatePoints(currentUsers, arrowHeight)

	// Calculate possible attack collisions
	currentUsers = updateCanAttack(currentUsers, playerRadius, arrowRadius)

	// Check for alive players
	currentUsers = updateDead(currentUsers)

	io.emit("players", currentUsers)
}

// Socket setup
export const io = socket(server)

io.on("connection", socket => {
	console.log(`[${socket.id}] opened socket connection`)
	socket.on("identify", (data: {kind: string}) => {
		if (data.kind === "player") {
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

			const randomPos = {x: Math.floor(Math.random() * 1750) + 150, y: Math.floor(Math.random() * 450) + 60}
			const player = createPlayer(socket.id, data.name, randomPos)

			currentUsers.push(player)
			io.sockets.emit("joined", {player, currentUsers, id: socket.id})
			console.log(`[${socket.id}] joined the game as '${data.name}'`)
		} else {
			io.sockets.emit("set-name-failed", {name: data.name, id: socket.id})
		}
	})

	// Listen to events
	socket.on("controls", (controls: {movement: Point, attack: boolean}) => {
		const user = currentUsers.find(item => item.id === socket.id)
		if (user) {
			user.movement = controls.movement
			user.attack = controls.attack
			if (controls.attack && user.canAttack.length) {
				// console.log(`${user.name} is attacking`)
				user.canAttack.map(other => other.velocity.x += 10)
			}
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

// Start gameloops
const fps = 60
setInterval(update, 1000 / fps)
setInterval(() => currentUsers.map(user => user.secondsAlive++), 1000)
