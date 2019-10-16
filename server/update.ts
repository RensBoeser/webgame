import {Player, Point} from "./types"
import {io} from "./index"

export const updatePoints = (players: Array<Player>, arrowHeight: number): Array<Player> => {
	return players.map(player => ({
		...player,
		direction: round(player.movement.y === 0 && player.movement.x === 0 ? player.direction : Math.atan2(player.movement.y, player.movement.x)),
		velocity: {
			x: round(player.velocity.x * 0.9 + player.movement.x * 0.5),
			y: round(player.velocity.y * 0.9 + player.movement.y * 0.5)
		},
		position: {
			x: round(player.position.x += player.velocity.x),
			y: round(player.position.y += player.velocity.y)
		},
		arrowPosition: {
			x: round(arrowHeight * Math.cos(player.direction * (180 / Math.PI)) + player.position.x),
			y: round(arrowHeight * Math.sin(player.direction * (180 / Math.PI)) + player.position.y)
		}
	}))
}

export const updateCanAttack = (players: Array<Player>, playerRadius: number, arrowRadius: number): Array<Player> => players.map((player, _, array) => {
	const others = array.filter(p => p !== player)
	return {...player, canAttack: others.filter(other => {
		const inRangeOfArrow = inRange(player.arrowPosition, other.position, arrowRadius)
		const inRangeOfPlayer = inRange(player.position, other.position, playerRadius)

		return inRangeOfArrow && inRangeOfPlayer
	})}
})

export const updateDead = (players: Array<Player>): Array<Player> => players.filter(player => {
	if (player.position.y < 10 || player.position.y > 600 || player.position.x < 90 || player.position.x > 1830) {
		io.emit("dead", player.id)
		return false
	}
	return true
})

const round = (n: number) => n < 0.01 && n > -0.01 ? 0 : Math.floor(n * 1000) / 1000

const inRange = (a: Point, b: Point, radius: number) => {
	const xDiff = Math.round(a.x - b.x)
	const yDiff = Math.round(a.y - b.y)
	return radius * radius > xDiff * xDiff + yDiff * yDiff
}

// OLD CODE
// const radius = 150
// const pairs = currentUsers.reduce((acc, curr, index) => {
// 	const inRange = currentUsers.slice(index + 1).filter(otherUser => {
// 		const x = curr.position.x - otherUser.position.x
// 		const y = curr.position.y - otherUser.position.y

// 		return radius > Math.sqrt((x * x) + (y * y))
// 	})
// 	return [...acc, ...inRange.map(usr => [curr, usr] as [Player, Player])]
// }, [] as Array<[Player, Player]>)

// const redArrowsForUsers = pairs.map(pair => {
// 	const directionInDegrees1 = pair[0].direction * (180 / Math.PI)
// 	const directionInDegrees2 = pair[1].direction * (180 / Math.PI)
// 	const arrowPosition1 = {
// 		x: arrowHeight * Math.cos(directionInDegrees1) + pair[0].position.x,
// 		y: arrowHeight * Math.sin(directionInDegrees1) + pair[0].position.y
// 	}
// 	const arrowPosition2 = {
// 		x: arrowHeight * Math.cos(directionInDegrees2) + pair[1].position.x,
// 		y: arrowHeight * Math.sin(directionInDegrees2) + pair[1].position.y
// 	}

// 	const x1 = arrowPosition1.x - pair[1].position.x
// 	const y1 = arrowPosition1.y - pair[1].position.y
// 	const x2 = arrowPosition2.x - pair[0].position.x
// 	const y2 = arrowPosition2.y - pair[0].position.y

// 	// pair[0].canAttack = arrowRadius > Math.sqrt(x1 * x1 + y1 * y1)
// 	// pair[1].canAttack = arrowRadius > Math.sqrt(x2 * x2 + y2 * y2)

// 	return [pair[0], pair[1]]
// })

// redArrowsForUsers.map(pair => {
// 	// Update the users that can attack
// 	pair.map(user => {
// 		const currentUser = currentUsers.find(item => item.id === user.id)
// 		if (currentUser) {
// 			currentUser.canAttack = pair[0].canAttack
// 		}
// 	})

// 	// Attack (SHOULD BE SOMEWHERE ELSE)
// 	if (pair[0].canAttack && pair[0].attack) {
// 		pair[1].velocity.x += 20
// 		pair[1].velocity.y += 20
// 	}
// 	if (pair[1].canAttack && pair[1].attack) {
// 		pair[0].velocity.x += 20
// 		pair[0].velocity.y += 20
// 	}
// })
