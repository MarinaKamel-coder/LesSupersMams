import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Informations de l'utilisateur extraites du token JWT
       * sub: ID de l'utilisateur (Int)
       * email: Email de l'utilisateur
       * role: Rôle pour la gestion des accès (USER ou ADMIN)
       */
      user?: {
        sub: number;
        email: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}
