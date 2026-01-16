import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext";
import {useState} from "react";

export function HomePage() {
  const { user, isLoading} = useAuth();
    const navigate = useNavigate();
    //Recherche Rapide
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");

  function onSearch(e: React.FormEvent) {
        e.preventDefault();
      const params = new URLSearchParams();
      if (from.trim()) params.set("departure", from.trim());
      if (to.trim()) params.set("arrival", to.trim());
      if (date) params.set("date", date);
      navigate(`/booking?${params.toString()}`);
    }
     if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="gc-grid" style={{ gap: 18 }}>
      <section className="gc-hero">
        <h1 className="gc-title">GreenCommute</h1>
        <p className="gc-subtitle">
          Plateforme de covoiturage écologique — réduis tes émissions en partageant tes trajets.
        </p>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {user ? (
            <>
              <Link className="gc-link" to="/dashboard">Aller au dashboard</Link>
              <Link className="gc-link" to="/create-trip">Publier un trajet</Link>
              <button type="button" onClick={() => navigate("/booking")}>Réservation</button>
            </>
          ) : (
            <Link className="gc-link" to="/login">Se connecter / S’inscrire</Link>
          )}
        </div>
      </section>

      <section className="gc-card">
        <div className="gc-cardBody">
          <h2 style={{ marginTop: 0 }}>Recherche rapide</h2>
          <form onSubmit={onSearch} className="gc-grid" style={{ maxWidth: 680 }}>
            <div className="gc-grid gc-grid-3" style={{ gap: 12 }}>
              <input
                placeholder="Ville de départ"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                placeholder="Ville d'arrivée"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit">Rechercher</button>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Astuce: commence par Montréal → Québec.
              </span>
            </div>
          </form>
        </div>
      </section>

      <section className="gc-grid gc-grid-3">
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Impact</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Chaque trajet partagé divise les émissions par passager.</p>
        </div></div>
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Confiance</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Avis et notes après chaque trajet.</p>
        </div></div>
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Communauté</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Badges éco et stats personnelles.</p>
        </div></div>
      </section>
    </div>
  );
}