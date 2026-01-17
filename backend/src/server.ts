import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from "http";

// Import des routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tripRoutes from './routes/trip.routes';
import vehicleRoutes from './routes/vehicles.routes';
import bookingRoutes from './routes/booking.routes';
import messageRoutes from './routes/message.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import { initSocket } from "./realtime/socket";

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Autorise le futur Frontend
app.use(express.json()); // Permet de lire le JSON dans req.body

// --- Routes API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// --- Route de santé (Health Check) ---
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 GreenCommute API is running',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  });
});

// --- Lancement du serveur ---
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('==============================================');
  console.log(`✅ Server started on: http://localhost:${PORT}`);
  console.log(`🌍 CO2 Tracking: Active`);
  console.log('==============================================');
});

export default app;
