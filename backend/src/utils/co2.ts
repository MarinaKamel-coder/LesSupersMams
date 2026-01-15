// Facteurs d'émission (kg CO2 / Unité) pour le Québec
export const EMISSION_FACTORS = {
  ESSENCE: 2.31,     // kg par Litre
  DIESEL: 2.68,      // kg par Litre
  ELECTRIQUE: 0.012, // kg par kWh (Hydro-Québec)
  HYBRIDE: 1.5,      // Moyenne pondérée
};

/**
 * Calcule le CO2 économisé par passager.
 * Formule : (Consommation × distance × Facteur / 100) - (Même calcul ÷ Nombre d'occupants)
 */
export const calculateCO2Saved = (
  consommation: number,
  distance: number,
  fuelType: keyof typeof EMISSION_FACTORS,
  availableSeats: number
): number => {
  const factor = EMISSION_FACTORS[fuelType];
  const totalEmissions = (consommation * distance * factor) / 100;
  
  // Nombre d'occupants total = conducteur + places disponibles
  const numOccupants = availableSeats + 1;
  const sharedCO2 = totalEmissions / numOccupants;
  
  // Économie = Émissions totales - Part individuelle du conducteur
  const saved = totalEmissions - sharedCO2
  
  return parseFloat(saved.toFixed(2));
};