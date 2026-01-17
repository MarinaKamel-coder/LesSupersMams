
import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Vehicle, FuelType } from "../types/user";

type VehiclesListResponse = { data: Vehicle[] };

type CreateVehicleInput = {
  brand: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
  consumption: number;
  fuelType: FuelType;
};

export function VehiclesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const consumptionUnit = "L/100 km";

  const [form, setForm] = useState<CreateVehicleInput>({
    brand: "",
    model: "",
    color: "",
    plate: "",
    seats: 4,
    consumption: 7.0,
    fuelType: "ESSENCE",
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Non authentifié");
      return apiFetch<VehiclesListResponse>("/api/vehicles", { token });
    },
  });

  const vehicles = useMemo(() => vehiclesQuery.data?.data ?? [], [vehiclesQuery.data]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Non authentifié");
      return apiFetch<Vehicle>("/api/vehicles", {
        method: "POST",
        token,
        body: form,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!token) throw new Error("Non authentifié");
      return apiFetch<void>(`/api/vehicles/${id}`, { method: "DELETE", token });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  if (!token) return <p>Connecte-toi pour gérer tes véhicules.</p>;
  if (vehiclesQuery.isLoading) return <p>Chargement…</p>;
  if (vehiclesQuery.isError) {
    return <div className="gc-alert">Erreur chargement véhicules</div>;
  }

  return (
    <div className="gc-grid" style={{ gap: 16 }}>
      <header>
        <h1 className="gc-title">Mes véhicules</h1>
        <p className="gc-subtitle">Ajoute et gère tes véhicules.</p>
      </header>

      <section className="gc-card">
        <div className="gc-cardBody" style={{ display: "grid", gap: 10 }}>
          <h2 style={{ marginTop: 0 }}>Ajouter un véhicule</h2>

          <input value={form.brand} onChange={(e) => setForm(f => ({...f, brand: e.target.value}))} placeholder="Marque" />
          <input value={form.model} onChange={(e) => setForm(f => ({...f, model: e.target.value}))} placeholder="Modèle" />
          <input value={form.color} onChange={(e) => setForm(f => ({...f, color: e.target.value}))} placeholder="Couleur" />
          <input value={form.plate} onChange={(e) => setForm(f => ({...f, plate: e.target.value}))} placeholder="Plaque" />

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Nombre de places (sièges)</label>
            <input
              type="number"
              value={form.seats}
              onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))}
              min={1}
              max={8}
              placeholder="Ex: 4"
            />
            <small style={{ opacity: 0.8 }}>Exemple: 4 = véhicule 4 places.</small>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontWeight: 700 }}>Consommation ({consumptionUnit})</label>
            <input
              type="number"
              step="0.1"
              value={form.consumption}
              onChange={(e) => setForm((f) => ({ ...f, consumption: Number(e.target.value) }))}
              min={0.1}
              placeholder={`Ex: 7 ${consumptionUnit}`}
            />
            <small style={{ opacity: 0.8 }}>
              Exemple: 7 = 7 {consumptionUnit}.
            </small>
          </div>

          <select value={form.fuelType} onChange={(e) => setForm(f => ({...f, fuelType: e.target.value as FuelType}))}>
            <option value="ESSENCE">ESSENCE</option>
            <option value="DIESEL">DIESEL</option>
            <option value="ELECTRIQUE">ELECTRIQUE</option>
            <option value="HYBRIDE">HYBRIDE</option>
          </select>

          <button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            Ajouter
          </button>
        </div>
      </section>

      <section className="gc-card">
        <div className="gc-cardBody">
          <h2 style={{ marginTop: 0 }}>Liste</h2>

          {vehicles.length === 0 ? (
            <p>Aucun véhicule.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {vehicles.map(v => (
                <li key={v.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{v.brand} {v.model} ({v.color})</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {v.plate} · {v.fuelType} · {v.seats} places · {v.consumption} {consumptionUnit}
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteMutation.mutate(v.id)} disabled={deleteMutation.isPending}>
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}