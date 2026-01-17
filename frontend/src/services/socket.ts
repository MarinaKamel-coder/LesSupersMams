import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../config";

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(token: string | null | undefined): Socket | null {
	if (!token) {
		disconnectSocket();
		return null;
	}

	if (socket && activeToken === token) return socket;

	disconnectSocket();
	activeToken = token;
	socket = io(API_BASE_URL, {
		auth: { token },
		transports: ["websocket"],
	});

	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
	}
	socket = null;
	activeToken = null;
}
