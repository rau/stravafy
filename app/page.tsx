"use client"

import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged, User } from "firebase/auth"
import { firebase } from "@/libs/firebase"
import { Connections } from "@/components/Connections"
import { StravaActivities } from "@/components/StravaActivites"

const Home = () => {
	const auth = getAuth(firebase)
	const [user, setUser] = useState<User | null>(null)
	const [isUserLoaded, setIsUserLoaded] = useState(false)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			setIsUserLoaded(true)
		})

		return () => unsubscribe()
	}, [auth])

	if (!isUserLoaded) {
		return <div>Loading...</div>
	}

	return (
		<>
			{user && <Connections user={user} />}
			{user && <StravaActivities user={user} />}
		</>
	)
}

export default Home
