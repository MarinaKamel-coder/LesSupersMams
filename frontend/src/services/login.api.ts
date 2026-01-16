import { API_BASE_URL } from "../config";

export type AuthUser = {
    id: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
};

export type AuthResponse = {
    token: string;
    user: AuthUser;    
};

const API_BASE = `${API_BASE_URL}/api`;  

async function request<T>(path: string, options: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}), 
      }, 
      ...options, 
    });

    const isJson = (res.headers.get("content-type") ?? "").includes("application/Json");
    const data = isJson ? await res.json(): await res.text();

    if (!res.ok) {
        // convention: {message: string} cote backend
        const message = 
        typeof data === "object" && data && "message" in data
            ? (data as any).message
            : `Erreur (${res.status})`;
        throw new Error(message);
    }

    return data as T;    
}

export function login(payload: {email: string; password: string}) {
    return request<AuthResponse>("../services/login", {
        method: "POST", 
        body: JSON.stringify(payload), 
    });
}

export function register(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}) {
    return request<AuthResponse>("../services/login", {
        method: "POST", 
        body: JSON.stringify(payload), 
    });
}
