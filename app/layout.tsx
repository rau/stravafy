"use client"

import { useState } from "react"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { useAuth } from "@/libs/useAuth"
import { firebase } from "@/libs/firebase"
import { Toaster } from "react-hot-toast"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import toast from "react-hot-toast"
import Image from "next/image"
import { Button } from "@/components/ui/Button"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { loading: isUserLoading } = useAuth()

	return (
		<html lang="en">
			<body
				className={`${inter.className} bg-gray-100 text-gray-900 min-h-screen`}
			>
				{!isUserLoading ? (
					<MainContent>{children}</MainContent>
				) : (
					<div className="flex items-center justify-center min-h-screen">
						<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
					</div>
				)}
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

const MainContent = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth()
	const auth = getAuth(firebase)
	const [googleIsLoading, setGoogleIsLoading] = useState(false)
	const handleGoogleLogin = async () => {
		const provider = new GoogleAuthProvider()
		try {
			setGoogleIsLoading(true)
			await signInWithPopup(auth, provider)
		} catch (error: any) {
			console.error("Login failed:", error)
			toast.error("Login failed")
		} finally {
			setGoogleIsLoading(false)
		}
	}

	const handleSignOut = async () => {
		try {
			await auth.signOut()
		} catch (error) {
			console.error("Logout failed:", error)
			toast.error("Logout failed")
		}
	}

	return (
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
									<Button onClick={handleSignOut}>
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
									Please log in to connect your accounts and
									view your activities.
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
				<footer className="py-6 text-center text-sm text-gray-500 mx-auto">
					<Image
						src="/powered_by_strava.png"
						alt="Stravafy Logo"
						width={100}
						height={100}
					/>
				</footer>
			</div>
		</div>
	)
}
