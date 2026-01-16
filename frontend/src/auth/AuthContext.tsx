/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from "react";

export type AuthUser = {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	rating?: number | null;
};

type AuthContextValue = {
	token: string | null;
	user: AuthUser | null;
	isLoading: boolean;
	setAuth: (token: string, user: AuthUser) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "greencommute_auth";

function safeJsonParse<T>(value: string | null): T | null {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const saved = safeJsonParse<{ token: string; user: AuthUser }>(
		localStorage.getItem(STORAGE_KEY)
	);

	const [token, setToken] = useState<string | null>(() => saved?.token ?? null);
	const [user, setUser] = useState<AuthUser | null>(() => saved?.user ?? null);
	const [isLoading] = useState(false);

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			user,
			isLoading,
			setAuth: (nextToken, nextUser) => {
				setToken(nextToken);
				setUser(nextUser);
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({ token: nextToken, user: nextUser })
				);
			},
			logout: () => {
				setToken(null);
				setUser(null);
				localStorage.removeItem(STORAGE_KEY);
			},
		}),
		[token, user, isLoading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
