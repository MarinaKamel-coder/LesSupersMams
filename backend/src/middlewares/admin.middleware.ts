import type { Request, Response, NextFunction } from "express";
import prisma from "../prisma/prisma";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).user?.sub as number | undefined;
		if (!userId) return res.status(401).json({ message: "Authentification requise" });

		const user = await prisma.user.findUnique({
			where: { id: Number(userId) },
			select: { role: true },
		});

		if (!user) return res.status(401).json({ message: "Utilisateur non trouvé" });
		if (user.role !== "ADMIN") return res.status(403).json({ message: "Accès administrateur requis" });

		return next();
	} catch {
		return res.status(500).json({ message: "Erreur serveur" });
	}
}
