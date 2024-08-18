"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { getIdToken } from "@/libs/firebase"
import { useAuth } from "@/libs/useAuth"
import Link from "next/link"

interface AccountInfo {
	username: string
	profileUrl: string
}

const Connections = () => {
	const { user } = useAuth()
	const [isStravaConnected, setIsStravaConnected] = useState<boolean | null>(
		null
	)
	const [isSpotifyConnected, setIsSpotifyConnected] = useState<
		boolean | null
	>(null)
	const [stravaInfo, setStravaInfo] = useState<AccountInfo | null>(null)
	const [spotifyInfo, setSpotifyInfo] = useState<AccountInfo | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (user) {
			checkConnections()
		} else {
			setIsStravaConnected(false)
			setIsSpotifyConnected(false)
			setStravaInfo(null)
			setSpotifyInfo(null)
			setIsLoading(false)
		}
	}, [user])

	const checkConnections = async () => {
		if (user) {
			setIsLoading(true)
			try {
				const [
					stravaConnected,
					spotifyConnected,
					stravaInfo,
					spotifyInfo,
				] = await Promise.all([
					checkConnection("strava"),
					checkConnection("spotify"),
					fetchAccountInfo("strava"),
					fetchAccountInfo("spotify"),
				])

				setIsStravaConnected(stravaConnected)
				setIsSpotifyConnected(spotifyConnected)
				if (stravaConnected) setStravaInfo(stravaInfo)
				if (spotifyConnected) setSpotifyInfo(spotifyInfo)
			} catch (error) {
				console.error("Error checking connections:", error)
			} finally {
				setIsLoading(false)
			}
		}
	}

	const checkConnection = async (service: "spotify" | "strava") => {
		const idToken = await getIdToken()
		const response = await fetch(
			`/api/verify?idToken=${idToken}&service=${service}`
		)
		const data = await response.json()
		return data.isConnected
	}

	const fetchAccountInfo = async (
		service: "spotify" | "strava"
	): Promise<AccountInfo> => {
		const idToken = await getIdToken()
		const response = await fetch(
			`/api/${service}/user-info?idToken=${idToken}`
		)
		return await response.json()
	}

	const getStravaConnectURL = async () => {
		if (!user) return
		const idToken = await getIdToken()
		const response = await fetch(`/api/oauth/strava?idToken=${idToken}`)
		const data = await response.json()
		window.location.href = data.authUrl
	}

	const getSpotifyConnectURL = async () => {
		if (!user) return
		const idToken = await getIdToken()
		const response = await fetch(`/api/oauth/spotify?idToken=${idToken}`)
		const data = await response.json()
		window.location.href = data.authUrl
	}

	const disconnectService = async (service: "spotify" | "strava") => {
		if (!user) return
		setIsLoading(true)
		try {
			const idToken = await getIdToken()
			const response = await fetch(`/api/${service}/disconnect`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ idToken }),
			})
			if (!response.ok) {
				throw new Error(`Failed to disconnect ${service}`)
			}
			if (service === "strava") {
				setIsStravaConnected(false)
				setStravaInfo(null)
			} else {
				setIsSpotifyConnected(false)
				setSpotifyInfo(null)
			}
		} catch (error) {
			console.error(`Error disconnecting ${service}:`, error)
		} finally {
			setIsLoading(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">Connected accounts</h2>
				<div className="flex flex-col gap-2">
					<div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
					<div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-xl font-semibold">Connected accounts</h2>
			<div className="flex flex-col gap-2">
				{isStravaConnected ? (
					<div className="flex items-center justify-between">
						<p>
							Strava:{" "}
							<Link
								href={stravaInfo?.profileUrl || "#"}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 hover:underline"
							>
								{stravaInfo?.username || "Connected"}
							</Link>
						</p>
						<Button
							onClick={() => disconnectService("strava")}
							variant="destructive"
						>
							Disconnect
						</Button>
					</div>
				) : (
					<Button onClick={getStravaConnectURL}>
						Connect Strava
					</Button>
				)}
				{isSpotifyConnected ? (
					<div className="flex items-center justify-between">
						<p>
							Spotify:{" "}
							<Link
								href={spotifyInfo?.profileUrl || "#"}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 hover:underline"
							>
								{spotifyInfo?.username || "Connected"}
							</Link>
						</p>
						<Button
							onClick={() => disconnectService("spotify")}
							variant="destructive"
						>
							Disconnect
						</Button>
					</div>
				) : (
					<Button onClick={getSpotifyConnectURL}>
						Connect Spotify
					</Button>
				)}
			</div>
		</div>
	)
}

export { Connections }
