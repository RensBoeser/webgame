import express from "express"
import socket from "socket.io"
import {hri} from "human-readable-ids"

import {scoreValues} from "./scores"
import {Player, Point} from "./types"
import {checkAttackingPlayers, updatePoints, updateDead} from "./update"

// App setup
const app = express()
const port = 5000
const server = app.listen(port, () => {
	console.log(`listening to requests on port ${port}`)
})

// Static files
app.use(express.static("public"))

// Variables
let currentUsers: Array<Player> = []
let queue: Array<{id: string, name: string}> = []
const maxPlayers = 40
const playerRadius = 100
const arrowHeight = 80

// Functions
const createPlayer = (id: string, name: string, startPosition: { x: number, y: number }): Player => ({
	id,
	name,
	position: startPosition,
	movement: { x: 0, y: 0 },
	velocity: { x: 0, y: 0 },
	direction: 0,
	attack: false,
	score: 0,
	color: Math.floor(Math.random() * 5),
	lastHit: ""
})

const update = () => {
	// Update player values
	currentUsers = updateDead(updatePoints(currentUsers, arrowHeight))

	checkQueue()

	checkAttackingPlayers(currentUsers, playerRadius)

	currentUsers.sort((a, b) => a.score > b.score ? -1 : a.score < b.score ? 1 : 0)

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
				currentUsers,
				name: generateName()
			})
		}
		console.log(`[${socket.id}] identified as '${data.kind}'`)
	})

	socket.on("set-name", (data: {name: string}) => {
		if (data.name && !currentUsers.find(user => user.name === data.name)) {
			if (currentUsers.length < maxPlayers) {
				spawnPlayer(data.name, socket.id)
			} else if (!queue.find(x => x.id === socket.id)) {
				console.log(`Added player ${data.name} to queue`)
				queue.push({id: socket.id, name: data.name})
				io.sockets.emit("queue", queue)
			}
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
		}
	})

	socket.on("get-new-name", _ => {
		socket.emit("new-name", {
			id: socket.id,
			name: generateName()
		})
	})

	socket.on("disconnect", _ => {
		const user = currentUsers.find(item => item.id === socket.id)
		currentUsers = currentUsers.filter(item => item.id !== socket.id)
		queue = queue.filter(item => item.id !== socket.id)
		io.sockets.emit("queue", queue)
		io.sockets.emit("disconnected", {
			id: socket.id,
			currentUsers,
			kind: user ? "player" : "screen"
		})
		console.log(`[${socket.id}] closed socket connection`)
	})

})

export const checkQueue = (): void => {
	while (queue.length && currentUsers.length < maxPlayers) {
		const p = queue[0]
		spawnPlayer(p.name, p.id)
		queue.shift()
		io.sockets.emit("queue", queue)
	}
}

export const spawnPlayer = (name: string, id: string): void => {
	currentUsers = currentUsers.filter(user => user.id !== id)

	const randomPos = {x: Math.floor(Math.random() * 1500) + 180, y: Math.floor(Math.random() * 450) + 100}
	const player = createPlayer(id, name, randomPos)

	currentUsers.push(player)
	io.sockets.emit("joined", {player, currentUsers, id})
	console.log(`[${id}] joined the game as '${name}'`)
}

const generateName = (): string => {
	let name = hri.random().split("-")
		.filter((_, index) => index < 2)
		.join(" ")
	name = name[0].toUpperCase() + name.slice(1)
	return currentUsers.find(user => user.name === name) ? generateName() : name
}

// Start gameloops
const fps = 60
setInterval(update, 1000 / fps)
setInterval(() => currentUsers.map(user => user.score += scoreValues.time), 1000)
