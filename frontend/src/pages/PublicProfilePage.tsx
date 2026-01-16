import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/api'; // On utilise ton service Axios
import type { User, Trip } from '../types/user';
import { Star, ShieldCheck, Car, Calendar, CheckCircle } from 'lucide-react';
import '../style/profile.css';

export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Utilisation des états pour stocker les données de l'API
  const [profile, setProfile] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchPublicData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // On récupère les données via le service Axios
      const response = await userService.getProfile(); 
      
      // Mise à jour du profil
      setProfile(response.user); 
      
      // Adaptation dynamique :
      // On vérifie si 'trips' existe dans l'objet user renvoyé par le backend.
      // Si oui, on les utilise, sinon on initialise un tableau vide.
      setTrips(response.user.tripsPosted || []); 
      
    } catch (err) {
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  };

  fetchPublicData();
}, [id]);

  if (loading) return <div className="profile-container text-center">Chargement...</div>;
  if (error || !profile) return <div className="profile-container text-red-500">{error}</div>;

  return (
    <div className="profile-container">
      {/* --- Header Section --- */}
      <section className="profile-header">
        <div className="avatar-wrapper">
          <img 
            src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
            className="profile-avatar"
            alt={`${profile.firstName} avatar`}
          />
          {profile.role === 'ADMIN' && (
            <div className="admin-badge">
              <ShieldCheck size={20} />
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{profile.firstName} {profile.lastName}</h1>
          <div className="rating-display">
            <div className="stars-container">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  fill={i < Math.floor(profile.rating) ? "currentColor" : "none"} 
                />
              ))}
            </div>
            <span className="font-bold text-gray-700">{profile.rating}/5</span>
          </div>
          <p className="bio-text">
            {profile.bio ? `"${profile.bio}"` : "Ce membre n'a pas encore de biographie."}
          </p>
        </div>
      </section>

      {/* --- Grid Content --- */}
      <div className="profile-grid">
        <aside className="sidebar-card">
          <h3 className="font-bold mb-4 text-gray-900 border-b pb-2">Vérifications</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle size={16} /> Email vérifié
            </li>
            <li className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar size={16} /> Membre depuis {new Date(profile.createdAt).getFullYear()}
            </li>
          </ul>
        </aside>

        <main className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Car size={22} className="text-emerald-500" />
            Trajets proposés par {profile.firstName}
          </h2>
          
          {trips.length > 0 ? (
            trips.map((tripItem) => (
              <div key={tripItem.id} className="trip-card">
                <div>
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <span>{tripItem.departureCity}</span>
                    <span className="text-gray-400">→</span>
                    <span>{tripItem.arrivalCity}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(tripItem.departureTime).toLocaleDateString('fr-CA')}
                  </p>
                </div>
                <button className="btn-view-trip">
                  Voir l'offre
                </button>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
              Aucun trajet actif pour le moment.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};