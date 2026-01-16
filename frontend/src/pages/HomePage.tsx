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

    function onsearch(e: React.FormEvent) {
        e.preventDefault();
        navigate(`/search?from=${from}&to=${to}&date=${date}`);
    }
     if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {/* ===== HEADER ===== */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1 style={{ color: "green" }}> GreenCommute </h1>

        <nav style={{ display: "flex", gap: 12 }}>
          {!user ? (
            <>
              <Link to="/loginPage">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          ) : (
            <>
              <Link to="/messages">Messages</Link>
              <Link to="/create-trip">Créer un trajet</Link>
            </>
          )}
        </nav>
      </header>
        {/* ===== HERO  ===== */}
      <section style={{ marginBottom: 40 }}>
        <h2>Covoiturage simple, rapide et écologique 🌱</h2>
        <p>
          Trouvez un trajet près de chez vous ou partagez le vôtre en quelques clics.
        </p>
      </section>
{/* ===== LIENS RAPIDES ===== */}
      <section>
        <h3>Accès rapide</h3>

        <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
          <li>
            <Link to="/">🔍 Page de recherche</Link>
          </li>
          <li>
            <Link to="/">🚗 Détails d’un trajet</Link>
          </li>
          <li>
            <Link to="/CreateTripPage">➕ Créer un trajet</Link>
          </li>
          <li>
            <Link to="/">💬 Messagerie</Link>
          </li>
          <li>
            <Link to="/LoginPage">🔐 Connexion</Link>
          </li>
          <li>
            <Link to="/">📝 Inscription</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}