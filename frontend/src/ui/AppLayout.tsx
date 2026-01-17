import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getSocket } from "../services/socket";

type Toast = {
  id: number;
  text: string;
  href?: string;
};

export function AppLayout() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useMemo(() => {
    return (text: string, href?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, text, href }].slice(-4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;

    const onMessage = (payload: unknown) => {
      const tripId =
        payload && typeof payload === "object" && "tripId" in payload
          ? Number((payload as { tripId?: unknown }).tripId)
          : null;
      pushToast("Nouveau message reçu", Number.isFinite(tripId) ? `/messages/${tripId}` : undefined);
    };

    const onBookingCreated = (payload: unknown) => {
      const tripId =
        payload && typeof payload === "object" && "tripId" in payload
          ? Number((payload as { tripId?: unknown }).tripId)
          : null;
      pushToast("Nouvelle réservation", Number.isFinite(tripId) ? `/trip/${tripId}` : "/my-bookings");
    };

    const onBookingStatus = (payload: unknown) => {
      const status =
        payload && typeof payload === "object" && "status" in payload
          ? String((payload as { status?: unknown }).status)
          : "";
      pushToast(`Réservation mise à jour${status ? `: ${status}` : ""}`, "/my-bookings");
    };

    socket.on("message:new", onMessage);
    socket.on("booking:created", onBookingCreated);
    socket.on("booking:status", onBookingStatus);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("booking:created", onBookingCreated);
      socket.off("booking:status", onBookingStatus);
    };
  }, [pushToast, token]);

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
                <Link to="/my-bookings" className="gc-link">Mes réservations</Link>
                <Link to="/messages" className="gc-link">Messages</Link>
                <Link to="/create-trip" className="gc-link">Créer un trajet</Link>
				        <Link to="/vehicles" className="gc-link">Véhicules</Link>
				        {user?.role === "ADMIN" && (
                <Link to="/admin" className="gc-link">Administration</Link>
                )} 
                <Link
                  to="/my-profile"
                  className="gc-link gc-user-name"
                  style={{ fontWeight: 'bold', marginLeft: '10px' }}
                >
                  {user?.firstName ? `Bonjour, ${user.firstName}` : user?.email}
                </Link>                
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

    {toasts.length ? (
      <div
        style={{
          position: "fixed",
          right: 16,
          top: 74,
          zIndex: 50,
          display: "grid",
          gap: 10,
          width: "min(360px, calc(100vw - 32px))",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="gc-card" style={{ cursor: t.href ? "pointer" : "default" }}>
            <div
              className="gc-cardBody"
              onClick={() => {
                if (!t.href) return;
                navigate(t.href);
              }}
              role={t.href ? "button" : undefined}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
            >
              <div style={{ fontSize: 14 }}>{t.text}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                style={{ padding: "6px 10px", borderRadius: 999 }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : null}
    </div>
  );
}