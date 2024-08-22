import { getFirestore } from "firebase-admin/firestore"
import { initAdmin } from "@/libs/firebaseAdmin"

export const refreshStravaToken = async (userId: string): Promise<string> => {
	await initAdmin()
	const db = getFirestore()
	const stravaDoc = await db.collection("strava").doc(userId).get()
	const stravaData = stravaDoc.data() as TokenData

	if (Math.floor(Date.now() / 1000) < stravaData.expiresAt) {
		return stravaData.accessToken
	}

	const response = await fetch("https://www.strava.com/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.STRAVA_CLIENT_ID!,
			client_secret: process.env.STRAVA_CLIENT_SECRET!,
			grant_type: "refresh_token",
			refresh_token: stravaData.refreshToken,
		}),
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error("Failed to refresh Strava token")
	}

	const newTokenData: TokenData = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
	}

	await db.collection("strava").doc(userId).update({
		accessToken: newTokenData.accessToken,
		refreshToken: newTokenData.refreshToken,
		expiresAt: newTokenData.expiresAt,
	})

	return newTokenData.accessToken
}

export const refreshSpotifyToken = async (userId: string): Promise<string> => {
	await initAdmin()
	const db = getFirestore()
	const spotifyDoc = await db.collection("spotify").doc(userId).get()
	const spotifyData = spotifyDoc.data() as TokenData

	// if (Math.floor(Date.now() / 1000) < spotifyData.expiresAt) {
	// 	return spotifyData.accessToken
	// }

	console.log(spotifyData)
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
	console.log("🚀 ~ refreshSpotifyToken ~ data:", data)

	if (!response.ok) {
		throw new Error("Failed to refresh Spotify token")
	}

	const newTokenData: TokenData = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token || spotifyData.refreshToken,
		expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
	}

	await db.collection("spotify").doc(userId).update({
		accessToken: newTokenData.accessToken,
		refreshToken: newTokenData.refreshToken,
		expiresAt: newTokenData.expiresAt,
	})

	return newTokenData.accessToken
}
