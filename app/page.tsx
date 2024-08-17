"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { useRouter } from "next/navigation"
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
	onAuthStateChanged,
	User,
} from "firebase/auth"
import firebase from "@/libs/firebase"
import toast from "react-hot-toast"

const Home = () => {
	const auth = getAuth(firebase)
	const router = useRouter()
	const [googleIsLoading, setGoogleIsLoading] = useState(false)
	const [user, setUser] = useState<User | null>(null)
	const [isUserLoaded, setIsUserLoaded] = useState(false)
	const [isStravaConnected, setIsStravaConnected] = useState(false)
	const [isSpotifyConnected, setIsSpotifyConnected] = useState(false)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			setIsUserLoaded(true)
			if (currentUser) {
				checkConnections(currentUser)
			} else {
				setIsStravaConnected(false)
				setIsSpotifyConnected(false)
			}
		})

		return () => unsubscribe()
	}, [auth])

	const checkConnections = async (user: User) => {
		const stravaConnected = await checkConnection("strava", user)
		const spotifyConnected = await checkConnection("spotify", user)
		// setIsStravaConnected(stravaConnected)
		// setIsSpotifyConnected(spotifyConnected)
	}

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
			toast.error("Login failed")
		}
	}

	const getStravaConnectURL = async () => {
		if (!user) {
			toast.error("Please log in first")
			return
		}
		const idToken = await user.getIdToken()
		const response = await fetch(`/api/oauth/strava?idToken=${idToken}`)
		const data = await response.json()
		window.location.href = data.authUrl
	}

	const getSpotifyConnectURL = async () => {
		if (!user) {
			toast.error("Please log in first")
			return
		}
		const idToken = await user.getIdToken()
		const response = await fetch(`/api/oauth/spotify?idToken=${idToken}`)
		const data = await response.json()
		window.location.href = data.authUrl
	}

	const checkConnection = async (
		service: "spotify" | "strava",
		user: User
	) => {
		if (!user) {
			return false
		}
		const idToken = await user.getIdToken()
		const response = await fetch(
			`/api/verify?idToken=${idToken}&service=${service}`
		)
		const data = await response.json()
		return data.isConnected
	}

	if (!isUserLoaded) {
		return <div>Loading...</div>
	}

	return (
		<div className="flex w-screen flex-col gap-2 overflow-x-auto text-slate-700 p-16 items-center">
			<h1 className="text-2xl font-bold">Stravafy</h1>
			<div className="flex flex-row justify-between gap-2">
				{user ? (
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
				{user && user.photoURL && (
					<Image
						src={user.photoURL}
						alt="Profile Picture"
						width={50}
						height={50}
						className="rounded-full"
					/>
				)}
			</div>

			<div className="flex flex-row justify-center items-center gap-4 mt-4">
				{user && !isStravaConnected && (
					<Button onClick={getStravaConnectURL}>
						Connect Strava
					</Button>
				)}
				{user && !isSpotifyConnected && (
					<Button onClick={getSpotifyConnectURL}>
						Connect Spotify
					</Button>
				)}
			</div>
			<div>
				{user && isStravaConnected && <p>Strava is connected</p>}
				{user && isSpotifyConnected && <p>Spotify is connected</p>}
			</div>
		</div>
	)
}

export default Home
