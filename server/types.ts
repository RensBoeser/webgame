export interface Player {
	id: string
	name: string
	position: Point
	movement: Point
	velocity: Point
	arrowPosition: Point
	direction: number
	attack: boolean
	canAttack: Array<Player>
	secondsAlive: number
	kills: number
	score: number
}

export interface Point {
	x: number
	y: number
}
