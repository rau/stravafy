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
		const spotifyDoc = await db.collection("spotify").doc(uid).get()
		const spotifyData = spotifyDoc.data()

		if (!spotifyData || !spotifyData.accessToken) {
			return NextResponse.json(
				{ error: "Spotify not connected" },
				{ status: 400 }
			)
		}

		const response = await fetch("https://api.spotify.com/v1/me", {
			headers: {
				Authorization: `Bearer ${spotifyData.accessToken}`,
			},
		})

		if (!response.ok) {
			throw new Error("Failed to fetch Spotify user info")
		}

		const userData = await response.json()

		return NextResponse.json({
			username: userData.display_name || userData.id,
			profileUrl: userData.external_urls.spotify,
		})
	} catch (error) {
		console.error("Error fetching Spotify user info:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
