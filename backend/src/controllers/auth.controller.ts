import type { Request , Response } from 'express';
import prisma from '../prisma/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

export const register = async (req: Request, res: Response) => {
    // 1. Récupérer TOUS les champs obligatoires selon le  schéma Prisma
    const { email, password, firstName, lastName } = req.body;

    // Validation simple pour éviter l'erreur Prisma
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Tous les champs (email, password, firstName, lastName) sont requis.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: 'User existe déjà avec cet email !' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Passer les données complètes au create
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName, // Ajouté
            lastName   // Ajouté
        }
    });

    // Sécurité : Ne pas renvoyer le mot de passe dans la réponse
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
        success: true,
        message: 'Utilisateur enregistré avec succès !',
        user: userWithoutPassword
    });
}

export const login = async (req: Request, res: Response) =>{
    const { email, password} = req.body;

    const user = await prisma.user.findUnique({where: {email}});
    if(!user) return res.status(400).json({message:' Utilisateur non trouve !'});

    const motDePasseValide = await bcrypt.compare(password, user.password)
    if(!motDePasseValide) return res.status(400).json({message: 'Mot de passe incorrect !'});

    const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        {expiresIn: '1h'}
    )

    return res.status(200).json({
        success: true,
        message: 'Connexion reussie !',
        token,
        user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rating: user.rating,
            role: user.role
        }
    })
}
