import { useMemo, useState } from 'react';
import { createTrip } from '../services/api';
import { User } from '../types/User';
import { Trip } from '../types/Trip';   

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

const AddTripForm = ({ onTripAdded }: Props) => {
    const [departureCity, setdepartureCity] = useState('');
    const [arrivalCity, setarrivalCity] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTrip({ departureCity, arrivalCity });
            setdepartureCity('');
            setarrivalCity('');
            onTripAdded(); // Rafraîchir la liste
            alert('trajet ajouté avec succès !');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout du trajet");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
            <h3>Ajouter un trajet</h3>
            <div>
                <label>departureCity: </label>
                <input
                    type="text"
                    value={departureCity}
                    onChange={(e) => setdepartureCity(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>arrivalCity: </label>
                <input
                    type="text"
                    value={arrivalCity}
                    onChange={(e) => setarrivalCity(e.target.value)}
                    required
                />
            </div>
            <button type="submit" style={{ marginTop: '10px' }}>Ajouter</button>
        </form>
    );
};

export default AddTripForm;
