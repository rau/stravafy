import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if there are no initialized apps
const apps = getApps()
const firebase = apps.length ? getApp() : initializeApp(firebaseConfig)

export { firebaseConfig, firebase }

export const getIdToken = async () => {
	const auth = getAuth(firebase)
	const user = auth.currentUser

	if (user) {
		try {
			const idToken = await user.getIdToken(true)
			return idToken
		} catch (error: any) {
			throw new Error("Error fetching ID token: ", error)
		}
	} else {
		throw new Error("User not authenticated")
	}
}
