import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

type JwtPayload = {
	sub?: number | string;
	role?: string;
};

function getJwtSecret(): string {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET manquant (requis pour Socket.IO auth)");
	}
	return secret;
}

function parseUserIdFromToken(token: string): number | null {
	try {
		const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
		const sub = decoded?.sub;
		if (typeof sub === "number") return sub;
		if (typeof sub === "string") {
			const n = Number(sub);
			return Number.isFinite(n) ? n : null;
		}
		return null;
	} catch {
		return null;
	}
}

export function initSocket(httpServer: HttpServer) {
	io = new Server(httpServer, {
		cors: {
			origin: true,
			methods: ["GET", "POST", "PATCH", "DELETE"],
		},
	});

	io.use((socket, next) => {
		const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
		if (!token) {
			return next(new Error("unauthorized"));
		}

		const userId = parseUserIdFromToken(token);
		if (!userId) {
			return next(new Error("unauthorized"));
		}

		(socket.data as { userId?: number }).userId = userId;
		return next();
	});

	io.on("connection", (socket) => {
		const userId = (socket.data as { userId?: number }).userId;
		if (userId) {
			socket.join(`user:${userId}`);
		}

		socket.on("trip:join", (tripId: number) => {
			if (!Number.isFinite(tripId)) return;
			socket.join(`trip:${tripId}`);
		});

		socket.on("trip:leave", (tripId: number) => {
			if (!Number.isFinite(tripId)) return;
			socket.leave(`trip:${tripId}`);
		});
	});

	return io;
}

export function getIO(): Server | null {
	return io;
}

export function emitToUser(userId: number, event: string, payload: unknown) {
	io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToTrip(tripId: number, event: string, payload: unknown) {
	io?.to(`trip:${tripId}`).emit(event, payload);
}
