import {Player, Point} from "./types"
import {scoreValues} from "./scores"
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
		}
	}))
}

export const updateDead = (players: Array<Player>): Array<Player> => players.filter(player => {
	if (player.position.y < 30 || player.position.y > 650 || player.position.x < 140 || player.position.x > 1825) {
		const doodenaar = players.find(p => p.id === player.lastHit)
		if (doodenaar) {
			doodenaar.score += scoreValues.kill
		}
		io.emit("dead", player.id)
		return false
	}
	return true
})

export const attackablePlayers = (players: Array<Player>, player: Player, radius: number): Array<Player> =>
	players.filter(other => other.id !== player.id ? inRange(player.position, other.position, radius) : false)

export const checkAttackingPlayers = (players: Array<Player>, radius: number): void => {
	players.forEach(player => {
		if (player.attack) {
			const targets = attackablePlayers(players, player, radius)
			targets.forEach(({id}) => {
				const actualTarget = players.find(player => player.id === id)
				if (actualTarget) {
					const diff = difference(player.position, actualTarget.position)
					const power = 30 / -(Math.abs(diff.x) + Math.abs(diff.y))

					actualTarget.velocity.x += power * diff.x
					actualTarget.velocity.y += power * diff.y
					player.velocity.x += power * diff.x * -0.2
					player.velocity.y += power * diff.y * -0.2

					io.emit("punch", {
						player,
						target: actualTarget
					})
					actualTarget.lastHit = player.id
					player.score += scoreValues.hit
				}
			})
		}
	})
}

const round = (n: number) => n < 0.01 && n > -0.01 ? 0 : Math.floor(n * 1000) / 1000

const difference = (a: Point, b: Point): Point => ({
	x: Math.round(a.x - b.x),
	y: Math.round(a.y - b.y)
})

const inRange = (a: Point, b: Point, radius: number): boolean => {
	const diff = difference(a, b)
	return radius * radius > diff.x * diff.x + diff.y * diff.y
}
