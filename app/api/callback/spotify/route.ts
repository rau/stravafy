import { NextResponse, NextRequest } from "next/server"
import { doc, setDoc } from "firebase/firestore"
import { initAdmin } from "@/libs/firebaseAdmin"
import db from "@/libs/firestore"

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code")
	const idToken = req.nextUrl.searchParams.get("state")

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

		const response = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${Buffer.from(
					`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
				).toString("base64")}`,
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code: code!,
				redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback/spotify`,
			}),
		})

		const data = await response.json()

		await setDoc(doc(db, "spotify", uid), {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
		})

		return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}`)
	} catch (error) {
		console.error("Error in Spotify callback:", error)
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 401 }
		)
	}
}
