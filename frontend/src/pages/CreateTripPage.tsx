import { useNavigate } from "react-router-dom";
import TripForm from "../components/TripForm";

export function CreateTripPage() {
	const navigate = useNavigate();

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<header>
				<h1 style={{ margin: 0 }}>Créer un trajet</h1>
				<p style={{ marginTop: 6, opacity: 0.8 }}>
					Publie un trajet et laisse le système calculer l’impact CO₂.
				</p>
			</header>

			<TripForm
				onTripAdded={() => {
					navigate("/dashboard");
				}}
			/>
		</div>
	);
}
