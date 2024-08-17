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

		const response = await fetch("https://www.strava.com/api/v3/athlete", {
			headers: {
				Authorization: `Bearer ${stravaData.accessToken}`,
			},
		})

		if (!response.ok) {
			throw new Error("Failed to fetch Strava user info")
		}

		const athleteData = await response.json()

		return NextResponse.json({
			username: athleteData.username,
			profileUrl: `https://www.strava.com/athletes/${athleteData.id}`,
		})
	} catch (error) {
		console.error("Error fetching Strava user info:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
