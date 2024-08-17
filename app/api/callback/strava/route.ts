import { NextResponse, NextRequest } from "next/server"
import { doc, setDoc } from "firebase/firestore"
import { initAdmin } from "@/libs/firebaseAdmin"
import db from "@/libs/firestore"

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code")
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

		const tokenResponse = await fetch(
			"https://www.strava.com/oauth/token",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					client_id: process.env.STRAVA_CLIENT_ID,
					client_secret: process.env.STRAVA_CLIENT_SECRET,
					code,
					grant_type: "authorization_code",
				}),
			}
		)

		const tokenData = await tokenResponse.json()

		await setDoc(doc(db, "strava", uid), {
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			expiresAt: tokenData.expires_at,
			athleteId: tokenData.athlete.id,
		})

		// Set up webhook subscription
		const webhookResponse = await fetch(
			"https://www.strava.com/api/v3/push_subscriptions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tokenData.access_token}`,
				},
				body: JSON.stringify({
					client_id: process.env.STRAVA_CLIENT_ID,
					client_secret: process.env.STRAVA_CLIENT_SECRET,
					callback_url:
						process.env.NODE_ENV === "development"
							? "https://stravafy.vercel.app/api/webhook/strava"
							: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/strava`,
					verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
				}),
			}
		)

		const webhookData = await webhookResponse.json()
		await setDoc(
			doc(db, "strava", uid),
			{ webhookSubscriptionId: webhookData.id },
			{ merge: true }
		)

		return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}`)
	} catch (error) {
		console.error("Error in Strava callback:", error)
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 401 }
		)
	}
}
