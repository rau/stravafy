"use client"

import { useState, useEffect } from "react"

import { getIdToken } from "@/libs/firebase"
import { useAuth } from "@/libs/useAuth"

const StravaActivities = () => {
	const { user } = useAuth()
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (user) {
			fetchRecentActivities()
		}
	}, [user])

	const fetchRecentActivities = async () => {
		try {
			const idToken = await getIdToken()
			const response = await fetch(`/api/strava?idToken=${idToken}`)
			const data = await response.json()
			setActivities(data.activities)
		} catch (error) {
			console.error("Error fetching recent activities:", error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return null
	}

	if (!user || !activities || activities.length === 0) {
		return null
	}

	return (
		<div className="mt-8">
			<h2 className="text-xl font-semibold mb-4">
				Recent Strava Activities
			</h2>
			<ul className="space-y-8">
				{activities.map((activity) => (
					<li key={activity.id} className="border p-4 rounded-md">
						<div className="flex justify-between w-full">
							<div className="w-1/2">
								<h3 className="font-semibold">
									{activity.name}
								</h3>
								<p>Type: {activity.type}</p>
								<p>
									Date:{" "}
									{new Date(
										activity.start_date
									).toLocaleString()}
								</p>
								<p>
									Distance:{" "}
									{(activity.distance / 1000).toFixed(2)} km
								</p>
								<p>
									Duration:{" "}
									{Math.floor(activity.moving_time / 60)}{" "}
									minutes
								</p>
							</div>
							<div className="ml-4 w-1/2">
								<h4 className="font-semibold">Songs</h4>
								{activity.songs === null ||
								activity.songs.length === 0 ? (
									<p className="text-sm text-gray-500">
										No songs found. This could be because no
										music was played or the activity is too
										old for Spotify to provide data.
									</p>
								) : (
									<ul className="list-disc list-inside">
										{activity.songs.map((song, index) => (
											<li key={index} className="text-sm">
												{song.name} -{" "}
												{song.artists.join(", ")}
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}

export { StravaActivities }
