"use client"

import { useAuth } from "@/libs/useAuth"
import { Connections } from "@/components/Connections"
import { StravaActivities } from "@/components/StravaActivites"

const Home = () => {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		)
	}

	return (
		<>
			{user && <Connections />}
			{user && <StravaActivities />}
		</>
	)
}

export default Home
