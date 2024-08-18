import { NextResponse, NextRequest } from "next/server"
import { getFirestore } from "firebase-admin/firestore"
import { initAdmin } from "@/libs/firebaseAdmin"

initAdmin()

export async function GET(req: NextRequest) {
	const mode = req.nextUrl.searchParams.get("hub.mode")
	const token = req.nextUrl.searchParams.get("hub.verify_token")
	const challenge = req.nextUrl.searchParams.get("hub.challenge")

	if (
		mode === "subscribe" &&
		token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
	) {
		return NextResponse.json({ "hub.challenge": challenge })
	} else {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 })
	}
}

export async function POST(req: NextRequest) {
	const body = await req.json()
	initAdmin()

	if (body.object_type === "activity") {
		try {
			const db = getFirestore()

			const stravaQuery = await db
				.collection("strava")
				.where("athleteId", "==", body.owner_id)
				.get()
			if (!stravaQuery.empty) {
				const stravaDoc = stravaQuery.docs[0]
				const userId = stravaDoc.id
				const stravaData = stravaDoc.data()

				const activityDetails = await getStravaActivityDetails(
					body.object_id,
					stravaData.accessToken
				)
				const spotifyTracks = await getSpotifyTracksForActivity(
					userId,
					activityDetails.start_date,
					activityDetails.elapsed_time
				)

				await updateActivityDescription(
					body.object_id,
					stravaData.accessToken,
					activityDetails.description,
					spotifyTracks
				)

				return NextResponse.json({ success: true })
			} else {
				console.error("No user found for athlete ID:", body.owner_id)
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				)
			}
		} catch (error) {
			console.error("Error processing webhook:", error)
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			)
		}
	}

	return NextResponse.json({ success: true })
}

async function getStravaActivityDetails(
	activityId: string,
	accessToken: string
) {
	const response = await fetch(
		`https://www.strava.com/api/v3/activities/${activityId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	)
	if (!response.ok) {
		throw new Error("Failed to fetch Strava activity details")
	}
	return await response.json()
}

async function getSpotifyTracksForActivity(
	userId: string,
	startDate: string,
	duration: number
) {
	const db = getFirestore()
	const spotifyDoc = await db.collection("spotify").doc(userId).get()
	const spotifyData = spotifyDoc.data()

	if (!spotifyData) {
		throw new Error("Spotify data not found for user")
	}

	const accessToken = await refreshSpotifyTokenIfNeeded(userId, spotifyData)

	const endTime = new Date(
		new Date(startDate).getTime() + duration * 1000
	).toISOString()
	const response = await fetch(
		`https://api.spotify.com/v1/me/player/recently-played?limit=50&before=${encodeURIComponent(
			endTime
		)}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	)

	if (!response.ok) {
		throw new Error("Failed to fetch Spotify tracks")
	}

	const data = await response.json()
	return data.items.filter((item: any) => {
		const playedAt = new Date(item.played_at).getTime()
		const activityStart = new Date(startDate).getTime()
		const activityEnd = activityStart + duration * 1000
		return playedAt >= activityStart && playedAt <= activityEnd
	})
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

async function updateActivityDescription(
	activityId: string,
	accessToken: string,
	originalDescription: string,
	spotifyTracks: any[]
) {
	const songsList = spotifyTracks.map((item: any) => ({
		name: item.track.name,
		artists: item.track.artists.map((artist: any) => artist.name),
		album_cover_url: item.track.album.images[0].url,
		duration_ms: item.track.duration_ms,
		played_at: new Date(item.played_at),
	}))

	const songsDescription = songsList
		.map(
			(song, index) =>
				`${index + 1}. ${song.name} by ${song.artists.join(
					", "
				)} (${new Date(song.played_at).toLocaleTimeString()})`
		)
		.join("\n")

	const updatedDescription = `${
		originalDescription ? originalDescription + "\n\n" : ""
	}Songs I listened to (from stravafy.vercel.app):\n${songsDescription}`

	const response = await fetch(
		`https://www.strava.com/api/v3/activities/${activityId}`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ description: updatedDescription }),
		}
	)

	if (!response.ok) {
		throw new Error("Failed to update Strava activity description")
	}

	return updatedDescription
}
