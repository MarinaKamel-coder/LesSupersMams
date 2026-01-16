import type { AuthUser } from "../auth/AuthContext";
import { apiFetch } from "./api";

export type LoginInput = {
	email: string;
	password: string;
};

export type RegisterInput = {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
};

export type AuthResponse = {
	token: string;
	user: AuthUser;
};

export async function login(input: LoginInput): Promise<AuthResponse> {
	return apiFetch<AuthResponse>("/api/auth/login", {
		method: "POST",
		body: input,
	});
}

// Le backend renvoie un token seulement au login.
// Pour simplifier le frontend, on enchaine register -> login.
export async function register(input: RegisterInput): Promise<AuthResponse> {
	await apiFetch("/api/auth/register", {
		method: "POST",
		body: input,
	});

	return login({ email: input.email, password: input.password });
}
