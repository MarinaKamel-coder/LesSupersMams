type LatLng = { lat: number; lng: number };

function normalizeCity(value: string) {
	return value
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/\s+/g, " ");
}

// Mapper simple (bonus examen): on couvre surtout les villes du Québec mentionnées dans l'app.
const CITY_COORDS: Record<string, LatLng> = {
	"montreal": { lat: 45.5019, lng: -73.5674 },
	"montreal, qc": { lat: 45.5019, lng: -73.5674 },
	"quebec": { lat: 46.8139, lng: -71.2080 },
	"quebec, qc": { lat: 46.8139, lng: -71.2080 },
	"laval": { lat: 45.6066, lng: -73.7124 },
	"laval, qc": { lat: 45.6066, lng: -73.7124 },
	"longueuil": { lat: 45.5312, lng: -73.5181 },
	"longueuil, qc": { lat: 45.5312, lng: -73.5181 },
	"sherbrooke": { lat: 45.4042, lng: -71.8929 },
	"sherbrooke, qc": { lat: 45.4042, lng: -71.8929 },
	"trois-rivieres": { lat: 46.3430, lng: -72.5430 },
	"trois-rivieres, qc": { lat: 46.3430, lng: -72.5430 },
	"trois rivieres": { lat: 46.3430, lng: -72.5430 },
	"trois rivieres, qc": { lat: 46.3430, lng: -72.5430 },
	"drummondville": { lat: 45.8839, lng: -72.4842 },
	"drummondville, qc": { lat: 45.8839, lng: -72.4842 },
	"gatineau": { lat: 45.4765, lng: -75.7013 },
	"gatineau, qc": { lat: 45.4765, lng: -75.7013 },
	"saguenay": { lat: 48.4284, lng: -71.0687 },
	"saguenay, qc": { lat: 48.4284, lng: -71.0687 },
	"saint-jean-sur-richelieu": { lat: 45.3071, lng: -73.2626 },
	"saint-jean-sur-richelieu, qc": { lat: 45.3071, lng: -73.2626 },
	"st-eustache": { lat: 45.5650, lng: -73.9050 },
	"st-eustache, qc": { lat: 45.5650, lng: -73.9050 },
	"chapais": { lat: 49.7842, lng: -74.8518 },
};

export function getCityCoords(city: string): LatLng | null {
	const key = normalizeCity(city);
	return CITY_COORDS[key] ?? null;
}

export function getMidpoint(a: LatLng, b: LatLng): LatLng {
	return {
		lat: (a.lat + b.lat) / 2,
		lng: (a.lng + b.lng) / 2,
	};
}
