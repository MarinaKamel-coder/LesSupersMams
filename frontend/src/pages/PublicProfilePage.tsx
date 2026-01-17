import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import type { Trip, User } from "../types/user";
import "../style/profile.css";

type PublicProfileResponse = {
  success: boolean;
  data: {
    user: User;
  };
};

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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
        setError(null);

        const response = await apiFetch<PublicProfileResponse>(
          `/api/public/users/${id}`
        );

        setProfile(response.data.user);
        setTrips(response.data.user.tripsPosted || []);
      } catch {
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
          {profile.role === "ADMIN" ? <div className="admin-badge">ADMIN</div> : null}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{profile.firstName} {profile.lastName}</h1>
          <div className="rating-display">
            <div className="stars-container" aria-label={`Note ${profile.rating}/5`}>
              {"★".repeat(Math.floor(profile.rating)).padEnd(5, "☆")}
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
              ✓ Email vérifié
            </li>
            <li className="flex items-center gap-2 text-gray-500 text-sm">
              📅 Membre depuis {new Date(profile.createdAt).getFullYear()}
            </li>
          </ul>
        </aside>

        <main className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            🚗 Trajets proposés par {profile.firstName}
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
                <button className="btn-view-trip" onClick={() => navigate(`/trip/${tripItem.id}`)}>
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
}