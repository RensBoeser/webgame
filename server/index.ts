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
	velocity: { x: 0, y: 0 },
	direction: 0,
	attack: false,
	secondsAlive: 0,
	kills: 0,
	score: 0
})

const update = () => {

	// Update player values
	currentUsers = currentUsers.map(user => ({
		...user,
		direction: user.movement.y === 0 && user.movement.x === 0 ? user.direction : Math.atan2(user.movement.y, user.movement.x),
		velocity: { x: user.velocity.x * 0.9 + user.movement.x, y: user.velocity.y * 0.9 + user.movement.y },
		position: { x: user.position.x += user.velocity.x, y: user.position.y += user.velocity.y }
	}))

	// Calculate possible attack collisions
	const radius = 150
	const arrowHeight = 100
	const arrowRadius = 100
	const pairs = currentUsers.reduce((acc, curr, index) => {
		const inRange = currentUsers.slice(index + 1).filter(otherUser => {
			const x = curr.position.x - otherUser.position.x
			const y = curr.position.y - otherUser.position.y

			return radius > Math.sqrt((x * x) + (y * y))
		})
		return [...acc, ...inRange.map(usr => [curr, usr] as [Player, Player])]
	}, [] as Array<[Player, Player]>)

	const redArrowsForUsers = pairs.map(pair => {
		const directionInDegrees1 = pair[0].direction * (180 / Math.PI)
		const directionInDegrees2 = pair[1].direction * (180 / Math.PI)
		const arrowPosition1 = {
			x: arrowHeight * Math.cos(directionInDegrees1) + pair[0].position.x,
			y: arrowHeight * Math.sin(directionInDegrees1) + pair[0].position.y
		}
		const arrowPosition2 = {
			x: arrowHeight * Math.cos(directionInDegrees2) + pair[1].position.x,
			y: arrowHeight * Math.sin(directionInDegrees2) + pair[1].position.y
		}

		const x1 = arrowPosition1.x - pair[1].position.x
		const y1 = arrowPosition1.y - pair[1].position.y
		const x2 = arrowPosition2.x - pair[0].position.x
		const y2 = arrowPosition2.y - pair[0].position.y

		const inRange1 = arrowRadius > Math.sqrt(x1 * x1 + y1 * y1)
		const inRange2 = arrowRadius > Math.sqrt(x2 * x2 + y2 * y2)

		return [{player: pair[0], canAttack: inRange1}, {player: pair[1], canAttack: inRange2}]
	})

	redArrowsForUsers.map(pair => {
		console.log(pair[0].canAttack, pair[1].canAttack)
		if (pair[0].canAttack && pair[0].player.attack) {
			pair[1].player.velocity.x += 40
			pair[1].player.velocity.y += 40
		}
		if (pair[1].canAttack && pair[1].player.attack) {
			pair[0].player.velocity.x += 40
			pair[0].player.velocity.y += 40
		}
	})

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
	socket.on("controls", (controls: {movement: Point, attack: boolean}) => {
		const user = currentUsers.find(item => item.id === socket.id)
		if (user) {
			user.movement = controls.movement
			user.attack = controls.attack
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
