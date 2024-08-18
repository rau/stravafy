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
import { Connections } from "@/components/Connections"
import { StravaActivities } from "@/components/StravaActivites"

const Home = () => {
	const auth = getAuth(firebase)
	const router = useRouter()
	const [googleIsLoading, setGoogleIsLoading] = useState(false)
	const [user, setUser] = useState<User | null>(null)
	const [isUserLoaded, setIsUserLoaded] = useState(false)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			setIsUserLoaded(true)
		})

		return () => unsubscribe()
	}, [auth])

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

	if (!isUserLoaded) {
		return <div>Loading...</div>
	}

	return (
		<>
			<div className="flex flex-row justify-between w-full">
				<h1 className="text-2xl font-bold">Stravafy</h1>
				<div className="flex flex-row justify-between gap-2 items-center">
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
					<div className="flex flex-row justify-center items-center gap-2">
						{user && user.photoURL && (
							<Image
								src={user.photoURL}
								alt="Profile Picture"
								width={36}
								height={36}
								className="rounded-full"
							/>
						)}
					</div>
				</div>
			</div>

			<Connections user={user} />
			{user && <StravaActivities user={user} />}
		</>
	)
}

export default Home
