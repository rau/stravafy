interface TokenData {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

interface Song {
	name: string
	artists: string[]
	album: string
}

interface Activity {
	id: string
	name: string
	type: string
	start_date: string
	distance: number
	moving_time: number
	songs: Song[] | null
}

interface StravaActivitiesProps {
	user: User | null
}
