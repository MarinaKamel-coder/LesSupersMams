// src/pages/BookingPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { getCityCoords, getMidpoint } from "../utils/geo";

// Services
import { tripService } from '../services/trip.service.ts';
import { bookingService } from '../services/booking.service.ts';

// Types
interface Trip {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  driver: {
    firstName: string;
    lastName: string;
    rating: number;
  };
  vehicle: {
    brand: string;
    model: string;
    fuelType: string;
  };
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  // États
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres simples
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
	const [timeFrom, setTimeFrom] = useState('');
	const [priceMax, setPriceMax] = useState('');
	const [minSeats, setMinSeats] = useState('1');
  
  /**
   * Charge les trajets
   */
  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err) {
      const maybeMessage = (err as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') return maybeMessage;
    }
    return fallback;
  };

  const loadTrips = useCallback(async (overrides?: {
		departureCity?: string;
		arrivalCity?: string;
		selectedDate?: string;
    timeFrom?: string;
    priceMax?: string;
    minSeats?: string;
	}) => {
    try {
      setLoading(true);
			const nextDepartureCity = overrides?.departureCity ?? departureCity;
			const nextArrivalCity = overrides?.arrivalCity ?? arrivalCity;
			const nextSelectedDate = overrides?.selectedDate ?? selectedDate;
      const nextTimeFrom = overrides?.timeFrom ?? timeFrom;
      const nextPriceMax = overrides?.priceMax ?? priceMax;
      const nextMinSeats = overrides?.minSeats ?? minSeats;

      const data = await tripService.searchTrips({
        departureCity: nextDepartureCity,
        arrivalCity: nextArrivalCity,
      date: nextSelectedDate ? new Date(nextSelectedDate) : undefined,
      timeFrom: nextTimeFrom || undefined,
      priceMax: nextPriceMax ? Number(nextPriceMax) : undefined,
      seats: nextMinSeats ? Number(nextMinSeats) : undefined,
      });
      setTrips(data as Trip[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des trajets'));
      console.error(err);
    } finally {
      setLoading(false);
    }
	}, [arrivalCity, departureCity, selectedDate]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  // Préremplir depuis /booking?departure=...&arrival=...&date=YYYY-MM-DD
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dep = params.get("departure") ?? "";
    const arr = params.get("arrival") ?? "";
    const date = params.get("date") ?? "";
		const tFrom = params.get("timeFrom") ?? "";
		const pMax = params.get("priceMax") ?? "";
		const seats = params.get("seats") ?? "";

    if (!dep && !arr && !date && !tFrom && !pMax && !seats) return;

    setDepartureCity(dep);
    setArrivalCity(arr);
    setSelectedDate(date);
		setTimeFrom(tFrom);
		setPriceMax(pMax);
		if (seats) setMinSeats(seats);
    void loadTrips({ departureCity: dep, arrivalCity: arr, selectedDate: date, timeFrom: tFrom, priceMax: pMax, minSeats: seats || minSeats });
    // On veut exécuter uniquement quand l'URL change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  /**
   * Recherche
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadTrips();
  };

  /**
   * Réinitialise les filtres
   */
  const handleReset = () => {
    setDepartureCity('');
    setArrivalCity('');
    setSelectedDate('');
		setTimeFrom('');
		setPriceMax('');
		setMinSeats('1');
		void loadTrips({ departureCity: '', arrivalCity: '', selectedDate: '', timeFrom: '', priceMax: '', minSeats: '1' });
  };

  /**
   * Réserve un trajet
   */
  const handleBookTrip = async (tripId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

		if (!token) {
			alert('Session invalide: token manquant. Reconnecte-toi.');
			navigate('/login');
			return;
		}

    if (!window.confirm('Confirmer la réservation ?')) {
      return;
    }

    try {
      await bookingService.requestBooking(tripId, token);
      alert('Réservation demandée avec succès !');
      void loadTrips(); // Rafraîchir la liste
    } catch (err: unknown) {
			alert(getErrorMessage(err, 'Erreur lors de la réservation'));
    }
  };

  /**
   * Formate la date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mapTrips = useMemo(() => {
    return trips
      .map((t) => {
        const from = getCityCoords(t.departureCity);
        const to = getCityCoords(t.arrivalCity);
        if (!from || !to) return null;
        return {
          trip: t,
          from,
          to,
          mid: getMidpoint(from, to),
        };
      })
      .filter(Boolean) as Array<{ trip: Trip; from: { lat: number; lng: number }; to: { lat: number; lng: number }; mid: { lat: number; lng: number } }>;
  }, [trips]);

  const mapCenter = useMemo(() => {
    if (mapTrips.length > 0) {
      return [mapTrips[0].mid.lat, mapTrips[0].mid.lng] as [number, number];
    }
    // Québec (par défaut)
    return [46.8139, -71.2080] as [number, number];
  }, [mapTrips]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Titre */}
      <h1 style={{ marginBottom: '30px' }}>Rechercher un trajet</h1>

      {/* Barre de recherche */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Ville de départ"
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              style={{ 
                padding: '10px', 
                flex: '1',
                minWidth: '200px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            
            <input
              type="text"
              placeholder="Ville d'arrivée"
              value={arrivalCity}
              onChange={(e) => setArrivalCity(e.target.value)}
              style={{ 
                padding: '10px', 
                flex: '1',
                minWidth: '200px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />

        <input
          type="time"
          value={timeFrom}
          onChange={(e) => setTimeFrom(e.target.value)}
          title="Heure minimale (utilisée surtout avec une date)"
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />

        <input
          type="number"
          min={0}
          step={0.5}
          placeholder="Prix max ($)"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          style={{
            padding: '10px',
            width: '140px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />

        <input
          type="number"
          min={1}
          step={1}
          title="Nombre de places minimum"
          placeholder="Places"
          value={minSeats}
          onChange={(e) => setMinSeats(e.target.value)}
          style={{
            padding: '10px',
            width: '110px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Rechercher
            </button>
            
            <button 
              type="button"
              onClick={handleReset}
              style={{
                padding: '10px 20px',
                background: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* Villes populaires */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px', color: '#666' }}>Villes populaires :</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Montréal', 'Québec', 'Laval', 'Sherbrooke', 'Trois-Rivières'].map(city => (
            <button
              key={city}
              onClick={() => {
                setDepartureCity(city);
						void loadTrips({ departureCity: city });
              }}
              style={{
                padding: '8px 16px',
                background: '#e3f2fd',
                border: '1px solid #1976d2',
                color: '#1976d2',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Message d'erreur */}
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

    {/* Carte (bonus) */}
    {!loading && mapTrips.length > 0 ? (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Carte des trajets</h2>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
            Astuce: clique un marqueur pour ouvrir le trajet.
          </p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
          <MapContainer center={mapCenter} zoom={7} style={{ height: 360, width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapTrips.map(({ trip, from, to }) => (
              <React.Fragment key={trip.id}>
                <Polyline positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: '#16a34a' }} />
                <Marker position={[from.lat, from.lng]}>
                  <Popup>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontWeight: 700 }}>{trip.departureCity} → {trip.arrivalCity}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>🕐 {formatDate(trip.departureTime)}</div>
                      <button type="button" onClick={() => navigate(`/trip/${trip.id}`)}>
                        Voir détails
                      </button>
                    </div>
                </Popup>
              </Marker>
              <Marker position={[to.lat, to.lng]} />
            </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    ) : null}

      {/* Liste des trajets */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement des trajets...</p>
        </div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Aucun trajet disponible</p>
          <button
            onClick={() => navigate('/create-trip')}
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
            Publier un trajet
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            {trips.length} trajet{trips.length > 1 ? 's' : ''} disponible{trips.length > 1 ? 's' : ''}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {trips.map(trip => (
              <div 
                key={trip.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}
              >
                {/* En-tête */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                      {trip.departureCity} → {trip.arrivalCity}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      🕐 {formatDate(trip.departureTime)}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      👤 {trip.driver.firstName} {trip.driver.lastName} • ⭐ {trip.driver.rating}/5
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: '#1976d2',
                      margin: '0 0 5px 0'
                    }}>
                      {trip.pricePerSeat.toFixed(2)} $
                    </p>
                    <p style={{ margin: '0', color: '#666' }}>
                      par place
                    </p>
                  </div>
                </div>

                {/* Détails */}
                <div style={{ 
                  display: 'flex', 
                  gap: '20px',
                  marginBottom: '15px',
                  color: '#666'
                }}>
                  <p>🚗 {trip.vehicle.brand} {trip.vehicle.model} ({trip.vehicle.fuelType})</p>
                  <p>👥 {trip.availableSeats} place{trip.availableSeats > 1 ? 's' : ''} disponible{trip.availableSeats > 1 ? 's' : ''}</p>
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #eee',
                  paddingTop: '15px'
                }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(`/trip/${trip.id}`)}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid #1976d2',
                        color: '#1976d2',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Voir les détails
                    </button>

                    <button
                      onClick={() => {
                        if (!token) {
                          navigate('/login');
                          return;
                        }
                        navigate(`/messages/${trip.id}`);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#e8f5e9',
                        border: '1px solid #2e7d32',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Messages
                    </button>
                  </div>

                  <button
                    onClick={() => handleBookTrip(trip.id)}
                    disabled={trip.availableSeats <= 0}
                    style={{
                      padding: '10px 20px',
                      background: trip.availableSeats <= 0 ? '#ccc' : '#2e7d32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: trip.availableSeats <= 0 ? 'not-allowed' : 'pointer',
                      opacity: trip.availableSeats <= 0 ? 0.6 : 1
                    }}
                  >
                    {trip.availableSeats <= 0 ? 'Complet' : 'Réserver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;