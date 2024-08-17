// @ts-nocheck
import axios, { AxiosRequestConfig } from "axios"
import { getAuth } from "firebase/auth"
import toast from "react-hot-toast"

interface FetchParameters {
	file?: File
	files?: File[]
	method?: string
	data?: Record<string, any>
	params?: Record<string, any>
}

export const fetchWithAxios = async (
	endpoint: string,
	parameters: FetchParameters = {},
	responseType: "json" | "blob" = "json"
) => {
	const auth = getAuth()
	const user = auth.currentUser

	let idToken
	if (user) {
		idToken = await user.getIdToken(true)

		document.cookie = `idToken=${idToken}; path=/;`
	}
	const formData = new FormData()

	let options: AxiosRequestConfig = {
		method: parameters.method || "GET",
		url: process.env.NEXT_PUBLIC_API_URL + endpoint,
		headers: {
			Authorization: "Bearer " + idToken,
		},
		responseType: responseType,
	}

	if (parameters.files) {
		parameters.files.forEach((file) => {
			formData.append("file", file.file)
		})

		if (parameters.data) {
			Object.keys(parameters.data).forEach((key) => {
				formData.append(key, parameters.data![key])
			})
		}

		options.headers!["Content-Type"] = "multipart/form-data"
		options.data = formData
	} else if (parameters.file) {
		formData.append("file", parameters.file)
		formData.append("method", parameters.method || "GET")

		if (parameters.data) {
			Object.keys(parameters.data).forEach((key) => {
				formData.append(key, parameters.data![key])
			})
		}

		options.headers!["Content-Type"] = "multipart/form-data"
		options.data = formData
	} else if (options.method === "GET" && parameters.params) {
		options.params = parameters.params
	} else {
		options.headers!["Content-Type"] = "application/json"
		options.data = parameters.data
	}
	try {
		const res = await axios(options)
		return {
			data: res.data,
			headers: res.headers,
			status: res.status,
			statusText: res.statusText,
		}
	} catch (error: AxiosError | any) {
		if (error.response) {
			const errorData = error.response.data
			const errors = errorData.errors
			let message = ""
			errors.forEach((error: any) => {
				message +=
					(error.code === null ? "" : error.code + "\n") +
					(error.detail === null ? "" : error.detail + "\n") +
					(error.attr === null ? "" : error.attr + "\n")
			})
			toast.error(message)
		}
		throw error
	}
}

export const getIdToken = async () => {
	const auth = getAuth()
	const user = auth.currentUser

	if (user) {
		try {
			const idToken = await user.getIdToken(true)
			return idToken
		} catch (error: any) {
			throw new Error("Error fetching ID token: ", error)
		}
	} else {
		throw new Error("User not authenticated")
	}
}
