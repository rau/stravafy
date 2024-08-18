"use client"

import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import {
	getAuth,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
} from "firebase/auth"
import firebase from "@/libs/firebase"
import { Toaster } from "react-hot-toast"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Button } from "@/components/ui/Button"
import Image from "next/image"
import toast from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [user, setUser] = useState<User | null>(null)
	const [isUserLoaded, setIsUserLoaded] = useState(false)
	const [googleIsLoading, setGoogleIsLoading] = useState(false)
	const auth = getAuth(firebase)

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
				await signInWithPopup(auth, provider)
			} else {
				await signInWithPopup(auth, provider)
			}
		} catch (error: any) {
			console.error("Login failed:", error)
			toast.error("Login failed")
		} finally {
			setGoogleIsLoading(false)
		}
	}

	return (
		<html lang="en">
			<body
				className={`${inter.className} bg-gray-100 text-gray-900 min-h-screen`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col min-h-screen">
						<header className="py-6">
							<nav className="flex justify-between items-center">
								<h1 className="text-2xl font-bold text-indigo-600">
									Stravafy
								</h1>
								<div className="flex items-center space-x-4">
									{user && (
										<>
											<span className="text-sm hidden sm:inline">
												{user.displayName}
											</span>
											{user.photoURL && (
												<Image
													src={user.photoURL}
													alt="Profile Picture"
													width={32}
													height={32}
													className="rounded-full"
												/>
											)}
											<Button
												onClick={() => auth.signOut()}
											>
												Logout
											</Button>
										</>
									)}
								</div>
							</nav>
						</header>
						<main className="flex-grow py-8">
							<div className="bg-white shadow-sm rounded-lg p-6">
								{!user && (
									<div className="text-center mb-8">
										<h2 className="text-2xl font-bold mb-4">
											Welcome to Stravafy
										</h2>
										<p className="mb-4">
											Please log in to connect your
											accounts and view your activities.
										</p>
										<Button
											onClick={handleGoogleLogin}
											disabled={googleIsLoading}
											className="text-lg px-6 py-3"
										>
											{googleIsLoading
												? "Loading..."
												: "Login with Google"}
										</Button>
									</div>
								)}
								{user && children}
							</div>
						</main>
						<footer className="py-6 text-center text-sm text-gray-500">
							A raunak creation
						</footer>
					</div>
				</div>
				<Toaster
					position="bottom-center"
					toastOptions={{
						duration: 3000,
						style: {
							background: "#333",
							color: "#fff",
						},
					}}
				/>
			</body>
		</html>
	)
}
