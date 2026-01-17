import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";



type Review = {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewee?: {
    firstName: string;
    lastName: string;
  };
  trip: {
    departureCity: string;
    arrivalCity: string;
  };
};

export function ReviewPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [tripId, setTripId] = useState("");
  const [revieweeId, setRevieweeId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const prefilledTripId = searchParams.get("tripId") ?? "";
  const prefilledRevieweeId = searchParams.get("revieweeId") ?? "";
  const isPrefilled = Boolean(prefilledTripId && prefilledRevieweeId);

  useEffect(() => {
    if (prefilledTripId) setTripId(prefilledTripId);
    if (prefilledRevieweeId) setRevieweeId(prefilledRevieweeId);
    // On ne veut pas ré-écraser si l'utilisateur modifie ensuite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadMyReviews() {
    if (!token) return;
    try {
      const res = await apiFetch<{ reviews: Review[] }>("/api/reviews/me", { token });
      setMyReviews(res.reviews ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger vos avis";
      setError(message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Session invalide: reconnecte-toi.");
      return;
    }

    const tripIdNum = Number(tripId);
    const revieweeIdNum = Number(revieweeId);
    if (!Number.isFinite(tripIdNum) || tripIdNum <= 0) {
      setError("Trip ID invalide");
      return;
    }
    if (!Number.isFinite(revieweeIdNum) || revieweeIdNum <= 0) {
      setError("ID utilisateur à évaluer invalide");
      return;
    }

    try {
      await apiFetch<{ review: unknown }>("/api/reviews", {
        method: "POST",
        token,
        body: {
          tripId: tripIdNum,
          revieweeId: revieweeIdNum,
          rating,
          comment,
        },
      });

      alert("Avis ajouté avec succès");
      if (!isPrefilled) {
        setTripId("");
        setRevieweeId("");
      }
      setRating(5);
      setComment("");
      void loadMyReviews();
      if (isPrefilled) {
        navigate("/my-bookings");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Erreur";
      setError(message);
    }
  }

  if (!user) return <p>Vous devez être connecté</p>;

  return (
    <div style={{ maxWidth: 700 }}>
      <h2>Avis</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* === Créer un avis === */}
      <section>
        <h3>Laisser un avis</h3>

        {isPrefilled ? (
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            Pré-rempli depuis une réservation: il ne reste qu’à noter et commenter.
          </p>
        ) : null}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="Trip ID"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            disabled={Boolean(prefilledTripId)}
          />

          <input
            placeholder="Utilisateur à évaluer (ID)"
            value={revieweeId}
            onChange={(e) => setRevieweeId(e.target.value)}
            disabled={Boolean(prefilledRevieweeId)}
          />

          <label htmlFor="rating">Note</label>

        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
>
          {[1, 2, 3, 4, 5].map((r) => (
           <option key={r} value={r}>
            {r} ⭐
            </option>
         ))}
        </select>


          <textarea
            placeholder="Commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button>Envoyer</button>
        </form>
      </section>

      {/* === Mes avis === */}
      <section style={{ marginTop: 32 }}>
        <h3>Mes avis donnés</h3>

        {myReviews.length === 0 && <p>Aucun avis</p>}

        {myReviews.map((r) => (
          <div key={r.id} style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
            <p>
              ⭐ {r.rating} – {r.trip.departureCity} → {r.trip.arrivalCity}
            </p>
            {r.comment && <p>{r.comment}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}