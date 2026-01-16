import { API_BASE_URL } from "../config";

export class ApiError extends Error {
	status: number;
	body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.body = body;
	}
}

type ApiFetchOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	token?: string | null;
	body?: unknown;
	headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
	const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
		...(options.headers ?? {}),
	};

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	const res = await fetch(url, {
		method: options.method ?? "GET",
		headers,
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
	});

	const contentType = res.headers.get("content-type") ?? "";
	const isJson = contentType.includes("application/json");
	const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

	if (!res.ok) {
		const message = (() => {
			if (body && typeof body === "object" && "message" in body) {
				const maybeMessage = (body as { message?: unknown }).message;
				if (typeof maybeMessage === "string") return maybeMessage;
			}
			return `Erreur API (${res.status})`;
		})();
		throw new ApiError(message, res.status, body);
	}

	return body as T;
}
