import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppLayout() {
  const { user, logout, token } = useAuth();

  return (
    <div>
      <header className="gc-header">
        <div className="gc-container gc-headerInner">
          <Link to="/" className="gc-brand">
            GreenCommute <span className="gc-pill">éco</span>
          </Link>

          <nav className="gc-nav">
            {token ? (
              <>
                <Link to="/dashboard" className="gc-link">Dashboard</Link>
                <Link to="/create-trip" className="gc-link">Créer un trajet</Link>
				{user?.role === "ADMIN" ? (
					<Link to="/admin" className="gc-link">Administration</Link>
				) : null}
                <span style={{ opacity: 0.85 }}>
                  {user?.firstName ? `Bonjour, ${user.firstName}` : user?.email}
                </span>
                <button type="button" onClick={logout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" className="gc-link">Connexion</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="gc-main">
        <div className="gc-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}