declare module "human-readable-ids" {
	export interface hri {
        random: () => string
	}
	const hri: hri
}