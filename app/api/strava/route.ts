import { NextResponse, NextRequest } from "next/server"
import { initAdmin } from "@/libs/firebaseAdmin"
import { getFirestore } from "firebase-admin/firestore"
import { refreshStravaToken, refreshSpotifyToken } from "@/libs/tokenRefresh"

export async function GET(req: NextRequest) {
	const idToken = req.nextUrl.searchParams.get("idToken")

	if (!idToken) {
		return NextResponse.json(
			{ error: "No ID token provided" },
			{ status: 401 }
		)
	}

	try {
		const firebaseAdmin = await initAdmin()
		const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
		const uid = decodedToken.uid

		const db = getFirestore()
		const stravaDoc = await db.collection("strava").doc(uid).get()
		const stravaData = stravaDoc.data()

		if (!stravaData) {
			return NextResponse.json(
				{ error: "Strava not connected" },
				{ status: 400 }
			)
		}

		const [stravaAccessToken, spotifyAccessToken] = await Promise.all([
			refreshStravaToken(uid),
			refreshSpotifyToken(uid),
		])

		const activities = await fetchStravaActivities(stravaAccessToken)
		const activitiesWithSongs = await addSongsToActivities(
			uid,
			activities,
			spotifyAccessToken
		)

		return NextResponse.json({ activities: activitiesWithSongs })
	} catch (error) {
		console.error("Error fetching activities with songs:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}

async function fetchStravaActivities(accessToken: string): Promise<Activity[]> {
	const response = await fetch(
		"https://www.strava.com/api/v3/athlete/activities?per_page=10",
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	)

	if (!response.ok) {
		throw new Error("Failed to fetch Strava activities")
	}

	return response.json()
}

async function addSongsToActivities(
	userId: string,
	activities: Activity[],
	spotifyAccessToken: string
): Promise<Activity[]> {
	const db = getFirestore()
	const spotifyDoc = await db.collection("spotify").doc(userId).get()
	const spotifyData = spotifyDoc.data()

	if (!spotifyData) {
		return activities
	}

	return Promise.all(
		activities.map(async (activity) => {
			const songs = await fetchSongsForActivity(
				spotifyAccessToken,
				activity
			)
			return { ...activity, songs }
		})
	)
}

async function fetchSongsForActivity(
	accessToken: string,
	activity: Activity
): Promise<Song[] | null> {
	const startTime = new Date(activity.start_date).getTime()
	const endTime = startTime + activity.moving_time * 1000

	const response = await fetch(
		`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${endTime}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	)

	if (!response.ok) {
		console.error("Failed to fetch Spotify data for activity:", activity.id)
		return null
	}

	const spotifyData = await response.json()
	return spotifyData.items
		.filter((item: any) => {
			const playedAt = new Date(item.played_at).getTime()
			return playedAt >= startTime && playedAt <= endTime
		})
		.map((item: any) => ({
			name: item.track.name,
			artists: item.track.artists.map((artist: any) => artist.name),
			album: item.track.album.name,
		}))
}
