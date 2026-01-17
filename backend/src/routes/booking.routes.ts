import {Router} from 'express';
import {requestBooking, updateBookingStatus, getMyBookings, cancelBooking, getTripBookingsForDriver,} from '../controllers/booking.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();
/**
 * @route   POST /bookings
 * @desc    Créer une réservation pour un trajet
 * @access  Authenticated users
 */
router.post('/', authenticate, requestBooking);
/**
 * @route Patch bookings/:bookingId/status
 * @desc  Mettre à jour le statut d'une réservation (accepter ou refuser)
 * @access Authenticated users
 */
router.patch('/:bookingId/status', authenticate, updateBookingStatus);

/**
 * @route   GET /bookings/trip/:tripId
 * @desc    Lister les réservations d'un trajet (conducteur)
 * @access  Authenticated users (driver only)
 */
router.get('/trip/:tripId', authenticate, getTripBookingsForDriver);
/**
 * @route   GET /bookings/my
 * @desc    Récupérer les réservations de l'utilisateur connecté
 * @access  Authenticated users
 */
router.get('/my', authenticate, getMyBookings);

/**
 * @route   DELETE /bookings/:bookingId
 * @desc    Annuler une réservation (passager)
 * @access  Authenticated users
 */
router.delete('/:bookingId', authenticate, cancelBooking);
export default router;