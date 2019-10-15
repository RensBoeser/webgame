export interface Player {
	id: string
	name: string
	position: Point
	movement: Point
	secondsAlive: number
	kills: number
	score: number
}

export interface Point {
	x: number
	y: number
}
