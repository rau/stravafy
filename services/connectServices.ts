import { fetchWithAxios } from "@/libs/fetch"

export const fetchRepoUrls = async () => {
	const { data } = await fetchWithAxios("users/repo-urls/", {
		method: "GET",
	})
	return data
}

export const fetchUser = async () => {
	const { data } = await fetchWithAxios("users/", {
		method: "GET",
	})
	return data
}

export const createCompany = async (companyName: string) => {
	const { data } = await fetchWithAxios("companies/", {
		method: "POST",
		data: { name: companyName },
	})
	return data
}

export const getStravaConnectURL = async () => {
	const { data } = await fetchWithAxios("connect/strava/", {
		method: "GET",
	})
	return data
}
