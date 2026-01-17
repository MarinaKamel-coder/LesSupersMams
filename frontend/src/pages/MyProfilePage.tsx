import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import { User, Leaf, Banknote, Edit2, Check, X } from "lucide-react";
import "../style/profile.css";

export function MyProfilePage() {
  const { token, user: authUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le formulaire
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: ""
  });

  const loadMyData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<any>("/api/users/profile", { token });
      if (response.success) {
        setData(response.data);
        setFormData({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          bio: response.data.user.bio || ""
        });
      } else {
        setData(null);
        setError("Impossible de charger votre profil");
      }
    } catch (err) {
      console.error("Erreur chargement profil", err);
      setData(null);
      setError("Impossible de charger votre profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setData(null);
      return;
    }
    void loadMyData();
  }, [token]);

  const handleUpdate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (!token) {
        setError("Session invalide: reconnecte-toi.");
        return;
      }

      const response = await apiFetch<any>("/api/users/profile", {
        method: "PUT",
        token, 
        body: formData
      });
      if (response.success) {
        setIsEditing(false);
        void loadMyData();
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour");
    }
  };

  if (loading) return <div className="loader">Chargement...</div>;
  if (!authUser || !token) return <p>Vous devez être connecté</p>;
  if (!data) return <div>{error ?? "Erreur."}</div>;

  const { user, stats } = data;
  const safeStats = stats ?? { totalCO2Saved: 0, moneyEarned: 0 };

  return (
    <div className="profile-container">
      <div className="profile-card private">
        <header className="profile-header">
          <div className="avatar-container">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <User size={50} />}
          </div>
          
          <div className="header-content">
            {isEditing ? (
              <div className="edit-names">
                <input 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Prénom"
                />
                <input 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Nom"
                />
              </div>
            ) : (
              <h1>{user.firstName} {user.lastName}</h1>
            )}
            <p className="role-badge">{user.role}</p>
          </div>

          <button className="edit-toggle-btn" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <X size={20} /> : <Edit2 size={20} />}
          </button>
        </header>

        <section className="profile-section">
          <h3>Bio</h3>
          {isEditing ? (
            <textarea 
              value={formData.bio}
              aria-label="bio"
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={4}
            />
          ) : (
            <p className="bio-text">{user.bio || "Aucune biographie rédigée."}</p>
          )}
        </section>

        {isEditing && (
          <button className="btn-save" onClick={handleUpdate}>
            <Check size={18} /> Enregistrer les modifications
          </button>
        )}

        {error && <p style={{ color: "#b00020", marginTop: 10 }}>{error}</p>}

        <div className="stats-dashboard">
          <div className="stat-box eco">
            <Leaf size={24} />
            <h3>{safeStats.totalCO2Saved} kg</h3>
            <p>CO2 Économisé</p>
          </div>
          <div className="stat-box money">
            <Banknote size={24} />
            <h3>{safeStats.moneyEarned} $</h3>
            <p>Gagnés</p>
          </div>
        </div>
      </div>
    </div>
  );
}