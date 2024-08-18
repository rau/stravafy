"use client"

import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import firebase from "@/libs/firebase"
import { Toaster } from "react-hot-toast"
import "@/app/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [user, setUser] = useState<User | null>(null)
	const [isUserLoaded, setIsUserLoaded] = useState(false)

	useEffect(() => {
		const auth = getAuth(firebase)
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			setIsUserLoaded(true)
		})

		return () => unsubscribe()
	}, [])

	return (
		<html lang="en">
			<body className={inter.className}>
				<div className="flex w-screen flex-col gap-2 overflow-x-auto text-slate-700 p-8 items-center">
					<div className="w-[64rem] flex flex-col gap-2">
						{children}
					</div>
				</div>
				<Toaster />
			</body>
		</html>
	)
}
