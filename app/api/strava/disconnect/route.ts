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
		const stravaDoc = await db.collection("strava").doc(uid).get()
		const stravaData = stravaDoc.data()

		if (!stravaData) {
			return NextResponse.json(
				{ error: "Strava not connected" },
				{ status: 400 }
			)
		}

		// Revoke Strava access
		await fetch("https://www.strava.com/oauth/deauthorize", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				access_token: stravaData.accessToken,
			}),
		})

		// Unsubscribe from webhook
		if (stravaData.webhookSubscriptionId) {
			await fetch(
				`https://www.strava.com/api/v3/push_subscriptions/${stravaData.webhookSubscriptionId}?client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${stravaData.accessToken}`,
					},
				}
			)
		}

		// Delete Strava data from Firestore
		await db.collection("strava").doc(uid).delete()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error disconnecting Strava:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
