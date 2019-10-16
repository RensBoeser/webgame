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
	score: 0,
	direction: 0
})

const updatePlayers = () => {

	// Calculate direction
	currentUsers = currentUsers.map(user => ({
		...user,
		direction: user.movement.y === 0 && user.movement.x === 0 ? user.direction : Math.atan2(user.movement.y, user.movement.x)
	}))

	// Calculate possible attack collisions
	const radius = 150
	const pairs = currentUsers.reduce((acc, curr, index) => {
		const inRange = currentUsers.slice(index + 1).filter(otherUser => {
			const x = curr.position.x - otherUser.position.x
			const y = curr.position.y - otherUser.position.y

			return radius > Math.sqrt((x * x) + (y * y))
		})
		return [...acc, ...inRange.map(usr => [curr, usr] as [Player, Player])]
	}, [] as Array<[Player, Player]>)

	/*const redArrowsForUsers = pairs.map(pair => {
		const pos = {
			x: pair[1].position.x - pair[0].position.x,
			y: pair[1].position.y - pair[0].position.y}
		const neededDirection = Math.atan2(pos.y, pos.x)

		const minDir = (neededDirection - Math.PI * 0.5)
		const minDirection = minDir > Math.PI * 2 ? minDir - 2 * Math.PI : minDir < 0 ? minDir + 2 * Math.PI : minDir
		const maxDir = (neededDirection + Math.PI * 0.5)
		const maxDirection = maxDir > Math.PI * 2 ? maxDir - 2 * Math.PI : maxDir < 0 ? maxDir + 2 * Math.PI : maxDir

		const normalisedDirection = pair[0].direction
		// const normalisedDirection = a > Math.PI * 2 ? a - 2 * Math.PI : a < 0 ? a + 2 * Math.PI : minDir

		let directionInRange = false

		if (maxDir > minDir) {
			directionInRange = minDir < normalisedDirection && maxDir > normalisedDirection

		} else {
			directionInRange = normalisedDirection < 0
				? (minDir < normalisedDirection && maxDir < normalisedDirection)
				: (minDir > normalisedDirection && maxDir > normalisedDirection)
		}

		console.log(directionInRange, minDir, maxDir, normalisedDirection)
	})
*/
	// if (currentUsers.length) {
	// 	console.log(currentUsers[0].direction)
	// }

	if (pairs.length) {
		console.log(pairs.map(pair => `${pair[0].name} & ${pair[1].name}`))
	}

	io.emit("players", currentUsers)
}

// Socket setup
const io = socket(server)

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

// Set periodic events
setInterval(updatePlayers, 16)
setInterval(() => currentUsers.map(user => user.secondsAlive++), 1000)
