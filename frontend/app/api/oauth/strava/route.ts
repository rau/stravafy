// React/Next
import { NextResponse, NextRequest } from "next/server"
// Components

// Hooks

// Libraries

// Icons

// Types

export async function GET(req: NextRequest) {
	const idToken = req.nextUrl.searchParams.get("idToken")
	if (!idToken) {
		return NextResponse.json(
			{ error: "No ID token provided" },
			{ status: 401 }
		)
	}

	const queryParams = new URLSearchParams({
		client_id: process.env.STRAVA_CLIENT_ID!,
		response_type: "code",
		approval_prompt: "force",
		scope: "read,read_all,profile:read_all,profile:write,activity:read,activity:read_all,activity:write",
		redirect_uri: `http://localhost:3000/api/callback/strava?idToken=${idToken}`,
	})

	const authUrl = `https://www.strava.com/oauth/authorize?${queryParams.toString()}`

	return NextResponse.json({ authUrl })
}
