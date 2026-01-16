import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";

interface Props {
    onTripAdded: () => void;
}
// id: number;
//   departureCity: string;
//   arrivalCity: string;
//   departureTime: string;
//   pricePerSeat: number;
//   availableSeats: number;
//   driver?: Partial<User>;

type Vehicle = {
    id: number;
    brand: string;
    model: string;
    seats: number;
    consumption: number;
    fuelType: string;
};

type CreateTripInput = {
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    availableSeats: number;
    pricePerSeat: number;
    description?: string;
    distanceKm: number;
    durationMin: number;
    vehicleId: number;
};

export default function TripForm({ onTripAdded }: Props) {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const vehiclesQuery = useQuery({
        queryKey: ["myVehicles"],
        queryFn: async () => {
            if (!token) throw new Error("Non authentifié");
            const res = await apiFetch<{ success: boolean; data: Vehicle[] }>("/api/users/vehicles", { token });
            return res.data;
        },
        enabled: Boolean(token),
    });

    const [departureCity, setDepartureCity] = useState("");
    const [arrivalCity, setArrivalCity] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [availableSeats, setAvailableSeats] = useState(1);
    const [pricePerSeat, setPricePerSeat] = useState(10);
    const [distanceKm, setDistanceKm] = useState(50);
    const [durationMin, setDurationMin] = useState(60);
    const [description, setDescription] = useState("");
    const [vehicleId, setVehicleId] = useState<number | null>(null);

    const canSubmit = useMemo(() => {
        return (
            Boolean(token) &&
            departureCity.trim().length > 0 &&
            arrivalCity.trim().length > 0 &&
            departureTime.trim().length > 0 &&
            vehicleId !== null
        );
    }, [token, departureCity, arrivalCity, departureTime, vehicleId]);

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error("Non authentifié");
            if (vehicleId === null) throw new Error("Véhicule requis");

            const payload: CreateTripInput = {
                departureCity: departureCity.trim(),
                arrivalCity: arrivalCity.trim(),
                departureTime,
                availableSeats,
                pricePerSeat,
                distanceKm,
                durationMin,
                vehicleId,
                ...(description.trim() ? { description: description.trim() } : {}),
            };

            return apiFetch("/api/trips", {
                method: "POST",
                token,
                body: payload,
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            onTripAdded();
            setDepartureCity("");
            setArrivalCity("");
            setDepartureTime("");
            setDescription("");
        },
    });

    if (!token) {
        return <p>Connecte-toi pour publier un trajet.</p>;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
            }}
            className="gc-card"
            style={{ maxWidth: 820 }}
        >
            <div className="gc-cardBody gc-grid">
              <h2 style={{ margin: 0 }}>Publier un trajet</h2>

            <div className="gc-grid" style={{ gap: 6 }}>
                <label>Ville de départ</label>
                <input value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} required />
            </div>

            <div className="gc-grid" style={{ gap: 6 }}>
                <label>Ville d'arrivée</label>
                <input value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} required />
            </div>

            <div className="gc-grid" style={{ gap: 6 }}>
                <label>Date / heure</label>
                <input
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                />
            </div>

            <div className="gc-grid" style={{ gap: 6 }}>
                <label>Véhicule</label>
                <select
                    value={vehicleId ?? ""}
                    onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)}
                    required
                    disabled={vehiclesQuery.isLoading}
                >
                    <option value="">Sélectionner…</option>
                    {(vehiclesQuery.data ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.brand} {v.model} — {v.seats} places ({v.fuelType})
                        </option>
                    ))}
                </select>
                {vehiclesQuery.isError ? (
                    <small style={{ color: "#b00020" }}>
                        {vehiclesQuery.error instanceof Error ? vehiclesQuery.error.message : "Erreur véhicules"}
                    </small>
                ) : null}
            </div>

            <div className="gc-grid gc-grid-2" style={{ gap: 12 }}>
                <div className="gc-grid" style={{ gap: 6 }}>
                    <label>Places dispo</label>
                    <input
                        type="number"
                        min={1}
                        value={availableSeats}
                        onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    />
                </div>
                <div className="gc-grid" style={{ gap: 6 }}>
                    <label>Prix / place ($)</label>
                    <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={pricePerSeat}
                        onChange={(e) => setPricePerSeat(Number(e.target.value))}
                    />
                </div>
                <div className="gc-grid" style={{ gap: 6 }}>
                    <label>Distance (km)</label>
                    <input
                        type="number"
                        min={1}
                        step={0.1}
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                    />
                </div>
                <div className="gc-grid" style={{ gap: 6 }}>
                    <label>Durée (min)</label>
                    <input
                        type="number"
                        min={1}
                        value={durationMin}
                        onChange={(e) => setDurationMin(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="gc-grid" style={{ gap: 6 }}>
                <label>Description (optionnel)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                <small style={{ opacity: 0.7 }}>
                    Le CO₂ économisé par passager est calculé automatiquement par le backend.
                </small>
            </div>

            <button type="submit" disabled={!canSubmit || createMutation.isPending}>
                {createMutation.isPending ? "Publication…" : "Publier"}
            </button>

            {createMutation.isError ? (
                <div className="gc-alert">
                    {createMutation.error instanceof Error ? createMutation.error.message : "Erreur"}
                </div>
            ) : null}

            {createMutation.isSuccess ? (
                <div className="gc-success">
                    Trajet publié.
                </div>
            ) : null}
            </div>
        </form>
    );
}
