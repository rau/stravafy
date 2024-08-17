import { NextResponse, NextRequest } from "next/server"
import { initAdmin } from "@/libs/firebaseAdmin"
import { getFirestore } from "firebase-admin/firestore"

export async function POST(req: NextRequest) {
	const { idToken } = await req.json()

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
		const spotifyDoc = await db.collection("spotify").doc(uid).get()
		const spotifyData = spotifyDoc.data()

		if (!spotifyData) {
			return NextResponse.json(
				{ error: "Spotify not connected" },
				{ status: 400 }
			)
		}

		// Revoke Spotify access
		await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${Buffer.from(
					`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
				).toString("base64")}`,
			},
			body: new URLSearchParams({
				grant_type: "client_credentials",
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				return fetch(`https://accounts.spotify.com/api/token`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${data.access_token}`,
					},
					body: new URLSearchParams({
						token: spotifyData.accessToken,
						token_type_hint: "access_token",
					}),
				})
			})

		// Delete Spotify data from Firestore
		await db.collection("spotify").doc(uid).delete()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error disconnecting Spotify:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
