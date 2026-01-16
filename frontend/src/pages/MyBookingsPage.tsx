// src/pages/MyBookingsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { bookingService } from '../services/booking.service';

interface Booking {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  trip: {
    id: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    pricePerSeat: number;
    driver: {
      firstName: string;
      lastName: string;
    };
  };
}

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
			if (!token) {
				setBookings([]);
				setError('Session invalide: token manquant. Reconnecte-toi.');
				return;
			}
			const data = await bookingService.getMyBookings(token);
			setBookings(data as Booking[]);
    } catch (err) {
      setError('Erreur lors du chargement des réservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
	}, [token]);

  // Charger les réservations
  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Annuler une réservation
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Annuler cette réservation ?')) {
      return;
    }

    try {
			if (!token) {
				alert('Session invalide: token manquant. Reconnecte-toi.');
				navigate('/login');
				return;
			}
			await bookingService.cancelBooking(bookingId, token);
      alert('Réservation annulée');
      void loadBookings(); // Rafraîchir
    } catch (err: unknown) {
      const message = (() => {
        if (err instanceof Error) return err.message;
        if (err && typeof err === "object" && "message" in err) {
          const maybeMessage = (err as { message?: unknown }).message;
          if (typeof maybeMessage === "string") return maybeMessage;
        }
        return "Erreur lors de l'annulation";
      })();
      alert(message);
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '#2e7d32';
      case 'PENDING': return '#ff9800';
      case 'REJECTED': return '#f44336';
      case 'CANCELLED': return '#757575';
      default: return '#666';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Veuillez vous connecter pour voir vos réservations</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>Mes réservations</h1>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Vous n'avez pas encore de réservations</p>
          <button
            onClick={() => navigate('/booking')}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Rechercher un trajet
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {bookings.map(booking => (
            <div 
              key={booking.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>
                    {booking.trip.departureCity} → {booking.trip.arrivalCity}
                  </h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    🕐 {formatDate(booking.trip.departureTime)}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    👤 {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '5px 10px',
                    background: getStatusColor(booking.status),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {booking.status === 'PENDING' && 'En attente'}
                    {booking.status === 'ACCEPTED' && 'Acceptée'}
                    {booking.status === 'REJECTED' && 'Refusée'}
                    {booking.status === 'CANCELLED' && 'Annulée'}
                  </span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '18px', color: '#1976d2' }}>
                    {booking.trip.pricePerSeat.toFixed(2)} $
                  </p>
                </div>
              </div>

              <div style={{ 
                marginTop: '15px', 
                paddingTop: '15px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                  Réservé le {formatDate(booking.createdAt)}
                </p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/trip/${booking.trip.id}`)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid #1976d2',
                      color: '#1976d2',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Voir trajet
                  </button>
                  
                  {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;