"use client"

// React/Next
import { useState } from "react"
import Image from "next/image"
// Components
import { Button } from "@/components/ui/Button"
// Hooks
import { useRouter } from "next/navigation"
// Libraries
import {
	getAuth,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	signInWithRedirect,
} from "firebase/auth"
import firebase from "@/libs/firebase"
// Icons

// Types

const Home = () => {
	const auth = getAuth(firebase)
	const router = useRouter()
	const [googleIsLoading, setGoogleIsLoading] = useState(false)
	const handleGoogleLogin = async () => {
		const provider = new GoogleAuthProvider()
		try {
			setGoogleIsLoading(true)
			const isMobile =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				)
			if (isMobile) {
				await signInWithRedirect(auth, provider)
			} else {
				await signInWithPopup(auth, provider)
			}
			setGoogleIsLoading(false)
			router.push("/")
		} catch (error: any) {
			setGoogleIsLoading(false)
		}
	}

	const getStravaConnectURL = () => {}

	return (
		<div className="flex w-screen flex-col gap-2 overflow-x-auto text-slate-700 p-16 items-center">
			<h1 className="text-2xl font-bold">Stravafy</h1>
			<div className="flex flex-row justify-between gap-2">
				{auth.currentUser ? (
					<Button onClick={() => auth.signOut()}>Logout</Button>
				) : (
					<Button
						onClick={handleGoogleLogin}
						disabled={googleIsLoading}
					>
						{googleIsLoading ? "Loading..." : "Login"}
					</Button>
				)}
			</div>
			<div className="flex flex-row justify-center items-center gap-2">
				{auth.currentUser && (
					<Image
						src={auth.currentUser.photoURL || ""}
						alt="Profile Picture"
						width={50}
						height={50}
						className="rounded-full"
					/>
				)}
			</div>

			<div className="flex flex-row justify-center items-center gap-4 mt-4">
				<Button onClick={() => router.push("/connect/strava")}>
					Connect Strava
				</Button>
				<Button onClick={() => router.push("/connect/spotify")}>
					Connect Spotify
				</Button>
			</div>
		</div>
	)
}

export default Home
