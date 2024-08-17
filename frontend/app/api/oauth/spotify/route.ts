import { NextResponse, NextRequest } from "next/server"

export async function GET(req: NextRequest, res: NextResponse) {
	const idToken = req.nextUrl.searchParams.get("idToken")
	if (!idToken) {
		return NextResponse.json(
			{ error: "No ID token provided" },
			{ status: 401 }
		)
	}

	const queryParams = new URLSearchParams({
		client_id: process.env.SPOTIFY_CLIENT_ID!,
		response_type: "code",
		scope: "user-read-private user-read-email user-read-recently-played user-read-playback-state user-read-currently-playing user-read-playback-position user-top-read user-read-recently-played",
		redirect_uri: `http://localhost:3000/api/callback/spotify`,
		state: idToken,
	})

	const authUrl = `https://accounts.spotify.com/authorize?${queryParams.toString()}`

	return NextResponse.json({ authUrl })
}
