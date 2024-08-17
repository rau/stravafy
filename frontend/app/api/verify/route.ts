import { NextResponse, NextRequest } from "next/server"
import { initAdmin } from "@/libs/firebaseAdmin"
import { getFirestore } from "firebase-admin/firestore"

export async function GET(req: NextRequest) {
	const idToken = req.nextUrl.searchParams.get("idToken")
	const service = req.nextUrl.searchParams.get("service")

	if (!idToken) {
		return NextResponse.json(
			{ error: "No ID token provided" },
			{ status: 401 }
		)
	}

	if (!service || (service !== "spotify" && service !== "strava")) {
		return NextResponse.json(
			{ error: "Invalid or missing service parameter" },
			{ status: 400 }
		)
	}

	try {
		const firebaseAdmin = await initAdmin()
		const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
		const uid = decodedToken.uid

		const db = getFirestore()
		const serviceDoc = await db.collection(service).doc(uid).get()

		if (serviceDoc.exists) {
			const data = serviceDoc.data()
			const isConnected = !!data?.accessToken
			return NextResponse.json({ isConnected })
		} else {
			return NextResponse.json({ isConnected: false })
		}
	} catch (error) {
		console.error(`Error checking ${service} connection:`, error)
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 401 }
		)
	}
}
