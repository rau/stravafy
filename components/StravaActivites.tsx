import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import { getIdToken } from "@/libs/firebase"

interface Song {
	name: string
	artists: string[]
	album: string
}

interface Activity {
	id: string
	name: string
	type: string
	start_date: string
	distance: number
	moving_time: number
	songs: Song[] | null
}

interface StravaActivitiesProps {
	user: User | null
}

const StravaActivities = ({ user }: StravaActivitiesProps) => {
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
			if (!response.ok) {
				throw new Error("Failed to fetch recent activities")
			}
			const data = await response.json()
			setActivities(data.activities)
		} catch (error) {
			console.error("Error fetching recent activities:", error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return <div>Loading recent activities...</div>
	}

	if (!user || activities.length === 0) {
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
						<div className="flex justify-between">
							<div>
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
							<div className="ml-4">
								<h4 className="font-semibold">Songs</h4>
								{activity.songs === null ? (
									<p className="text-sm text-gray-500">
										No songs found. This could be because no
										music was played or the activity is too
										old for Spotify to provide data.
									</p>
								) : activity.songs.length === 0 ? (
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
