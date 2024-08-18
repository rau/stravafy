import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { firebase } from "@/libs/firebase"

async function refreshSpotifyToken(userId: string): Promise<string> {
	const db = getFirestore(firebase)
	const spotifyDoc = await getDoc(doc(db, "spotify", userId))
	const spotifyData = spotifyDoc.data() as TokenData

	if (Math.floor(Date.now() / 1000) < spotifyData.expiresAt) {
		return spotifyData.accessToken
	}

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: spotifyData.refreshToken,
			client_id: process.env.SPOTIFY_CLIENT_ID!,
			client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
		}),
	})

	console.log("🚀 ~ refreshSpotifyToken ~ response:", response)

	const data = await response.json()

	if (!response.ok) {
		throw new Error("Failed to refresh Spotify token")
	}

	const newTokenData: TokenData = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token || spotifyData.refreshToken,
		expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
	}

	await updateDoc(doc(db, "spotify", userId), {
		accessToken: newTokenData.accessToken,
		refreshToken: newTokenData.refreshToken,
		expiresAt: newTokenData.expiresAt,
	})

	return newTokenData.accessToken
}

async function refreshStravaToken(userId: string): Promise<string> {
	const db = getFirestore(firebase)
	const stravaDoc = await getDoc(doc(db, "strava", userId))
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

	await updateDoc(doc(db, "strava", userId), {
		accessToken: newTokenData.accessToken,
		refreshToken: newTokenData.refreshToken,
		expiresAt: newTokenData.expiresAt,
	})

	return newTokenData.accessToken
}

export { refreshSpotifyToken, refreshStravaToken }
