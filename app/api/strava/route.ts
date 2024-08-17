import { NextResponse, NextRequest } from "next/server"
import { initAdmin } from "@/libs/firebaseAdmin"
import { getFirestore } from "firebase-admin/firestore"

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

		if (!stravaData || !stravaData.accessToken) {
			return NextResponse.json(
				{ error: "Strava not connected" },
				{ status: 400 }
			)
		}

		const spotifyDoc = await db.collection("spotify").doc(uid).get()
		const spotifyData = spotifyDoc.data()

		// Fetch recent Strava activities
		const stravaResponse = await fetch(
			"https://www.strava.com/api/v3/athlete/activities?per_page=10",
			{
				headers: {
					Authorization: `Bearer ${stravaData.accessToken}`,
				},
			}
		)

		if (!stravaResponse.ok) {
			throw new Error("Failed to fetch Strava activities")
		}

		const activities = await stravaResponse.json()

		// Fetch songs for each activity
		const activitiesWithSongs = await Promise.all(
			activities.map(async (activity: any) => {
				let songs = null

				if (spotifyData && spotifyData.accessToken) {
					const spotifyAccessToken =
						await refreshSpotifyTokenIfNeeded(uid, spotifyData)
					const startTime = new Date(activity.start_date).getTime()
					const endTime = startTime + activity.elapsed_time * 1000

					const spotifyResponse = await fetch(
						`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${endTime}`,
						{
							headers: {
								Authorization: `Bearer ${spotifyAccessToken}`,
							},
						}
					)

					if (spotifyResponse.ok) {
						const spotifyData = await spotifyResponse.json()
						songs = spotifyData.items
							.filter((item: any) => {
								const playedAt = new Date(
									item.played_at
								).getTime()
								return (
									playedAt >= startTime && playedAt <= endTime
								)
							})
							.map((item: any) => ({
								name: item.track.name,
								artists: item.track.artists.map(
									(artist: any) => artist.name
								),
								album: item.track.album.name,
							}))
					} else {
						console.error(
							"Failed to fetch Spotify data for activity:",
							activity.id
						)
					}
				}

				return {
					...activity,
					songs: songs,
				}
			})
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

async function refreshSpotifyTokenIfNeeded(userId: string, spotifyData: any) {
	if (Date.now() > spotifyData.expiresAt) {
		const response = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${Buffer.from(
					`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
				).toString("base64")}`,
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: spotifyData.refreshToken,
			}),
		})

		const data = await response.json()
		const db = getFirestore()
		await db
			.collection("spotify")
			.doc(userId)
			.update({
				accessToken: data.access_token,
				expiresAt: Date.now() + data.expires_in * 1000,
			})

		return data.access_token
	}

	return spotifyData.accessToken
}
