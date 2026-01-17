import L from "leaflet";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

let fixed = false;

export function fixLeafletIcons() {
	if (fixed) return;
	fixed = true;

	// Fix Vite: Leaflet ne trouve pas ses images par défaut en prod/dev.
	L.Icon.Default.mergeOptions({
		iconRetinaUrl,
		iconUrl,
		shadowUrl,
	});
}
