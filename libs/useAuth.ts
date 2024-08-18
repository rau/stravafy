import { getAuth, onAuthStateChanged, User } from "firebase/auth"
import { useEffect, useState } from "react"
import { firebase } from "./firebase"

export const useAuth = () => {
	const auth = getAuth(firebase)
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user)
			setLoading(false)
		})

		return () => unsubscribe()
	}, [])

	return { user, loading }
}
