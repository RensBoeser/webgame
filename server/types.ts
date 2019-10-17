export interface Player {
	id: string
	name: string
	position: Point
	movement: Point
	velocity: Point
	direction: number
	attack: boolean
	score: number
	color: number
	lastHit: string
}

export interface Point {
	x: number
	y: number
}
