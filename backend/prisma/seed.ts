// prisma/seed.ts
import { Role, FuelType, BookingStatus } from '../src/generated/prisma/client';

import bcrypt from 'bcrypt';

import prisma from '../src/prisma/prisma';
 
const quebecData = {

  cities: ['Montréal, QC', 'Québec, QC', 'Laval, QC', 'Gatineau, QC', 'Sherbrooke, QC', 'Trois-Rivières, QC', 'Saguenay, QC', 'Longueuil, QC', 'Drummondville, QC', 'Saint-Jean-sur-Richelieu, QC'],

  firstNames: ['Jean', 'Marie', 'Pierre', 'Julie', 'Marc', 'Sophie', 'David', 'Isabelle', 'Alexandre', 'Catherine', 'Michel', 'Nathalie', 'Patrick', 'Caroline', 'François', 'Valérie', 'Simon', 'Mélanie', 'Éric', 'Annie'],

  lastNames: ['Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Gagné', 'Ouellet', 'Pelletier', 'Bélanger', 'Lévesque', 'Bergeron'],

  bios: ['Passionné de covoiturage écologique depuis 5 ans.', 'Je partage mes trajets pour réduire mon empreinte carbone.', 'Conducteur prudent, musique calme et conversations intéressantes.', 'Étudiant en environnement, je privilégie le transport durable.', 'Père de famille qui fait le trajet quotidien pour le travail.', 'Consultante qui voyage souvent entre Montréal et Québec.', 'Amoureux de la nature, je compense mes émissions CO2.', 'Nouveau sur la plateforme, motivé à faire des économies.', 'Ingénieur qui croit au pouvoir du covoiturage collectif.', 'Retraité, je propose des trajets pour rencontrer des gens.'],

  vehicleBrands: [

    { brand: 'Toyota', models: ['Corolla', 'Camry', 'RAV4', 'Prius'] },

    { brand: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'HR-V'] },

    { brand: 'Tesla', models: ['Model 3', 'Model Y', 'Model S'] },

    { brand: 'Nissan', models: ['Leaf', 'Rogue', 'Sentra'] },

    { brand: 'Volkswagen', models: ['Golf', 'Jetta', 'Tiguan'] },

    { brand: 'Hyundai', models: ['Elantra', 'Tucson', 'Kona'] },

    { brand: 'Ford', models: ['Escape', 'Focus', 'Fusion'] }

  ],

  colors: ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Argent', 'Beige'],

  messages: ['Bonjour, je suis intéressé par votre trajet.', 'Salut! Je voudrais réserver une place.', 'Bonjour, est-ce que vous faites un arrêt à mi-chemin?', 'Hello! Je voyage avec un bagage à main seulement.'],

  reviews: [

    { rating: 5, comment: 'Excellent conducteur, très ponctuel!' },

    { rating: 4, comment: 'Bon covoiturage, petite discussion intéressante.' },

    { rating: 5, comment: 'Trajet agréable, voiture propre et confortable.' }

  ]

};
 
const random = {

  element: <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)],

  elements: <T>(array: T[], count: number): T[] => [...array].sort(() => 0.5 - Math.random()).slice(0, Math.min(count, array.length)),

  number: (min: number, max: number, decimal = 0): number => {

    const value = Math.random() * (max - min) + min;

    return decimal === 0 ? Math.floor(value) : parseFloat(value.toFixed(decimal));

  },

  futureDate: (daysFromNow: number): Date => {

    const date = new Date();

    date.setDate(date.getDate() + Math.random() * daysFromNow);

    date.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

    return date;

  },

  pastDate: (daysAgo: number): Date => {

    const date = new Date();

    date.setDate(date.getDate() - Math.random() * daysAgo);

    date.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

    return date;

  },

  email: (firstName: string, lastName: string): string => `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random.number(1, 999)}@example.ca`,

  licensePlate: (): string => {

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const nums = '0123456789';

    return `${chars[random.number(0, 25)]}${chars[random.number(0, 25)]}${chars[random.number(0, 25)]} ${nums[random.number(0, 9)]}${nums[random.number(0, 9)]}${nums[random.number(0, 9)]}`;

  }

};
 
async function main() {

  console.log('🌱 Début du seeding GreenCommute...');
 
  // 1. Nettoyage sécurisé

  await prisma.review.deleteMany();

  await prisma.message.deleteMany();

  await prisma.booking.deleteMany();

  await prisma.trip.deleteMany();

  await prisma.vehicle.deleteMany();

  await prisma.user.deleteMany();

  console.log('✅ Base nettoyée');
 
  const password = await bcrypt.hash('Password123!', 10);
 
  // 2. Création des utilisateurs (Admin + Drivers + Passengers)

  const userData = [

    { email: 'admin@greencommute.ca', firstName: 'Admin', lastName: 'Green', role: Role.ADMIN },

    ...Array.from({ length: 14 }).map((_, i) => ({

      email: random.email(quebecData.firstNames[i], quebecData.lastNames[i % quebecData.lastNames.length]),

      firstName: quebecData.firstNames[i],

      lastName: quebecData.lastNames[i % quebecData.lastNames.length],

      role: Role.USER,

      bio: random.element(quebecData.bios),

      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`

    }))

  ];
 
  await prisma.user.createMany({ 

    data: userData.map(u => ({ ...u, password })) 

  });
 
  const allUsers = await prisma.user.findMany();

  const drivers = allUsers.slice(1, 6);

  const passengers = allUsers.slice(6);
 
  // 3. Véhicules

  const fuelTypes = [

    { type: FuelType.ELECTRIQUE, cons: 16.0 },

    { type: FuelType.HYBRIDE, cons: 4.5 },

    { type: FuelType.ESSENCE, cons: 8.0 }

  ];
 
  for (const driver of drivers) {

    const brandInfo = random.element(quebecData.vehicleBrands);

    const fuel = random.element(fuelTypes);

    await prisma.vehicle.create({

      data: {

        brand: brandInfo.brand,

        model: random.element(brandInfo.models),

        color: random.element(quebecData.colors),

        plate: random.licensePlate(),

        seats: random.number(4, 5),

        consumption: fuel.cons,

        fuelType: fuel.type,

        ownerId: driver.id

      }

    });

  }
 
  const vehicles = await prisma.vehicle.findMany();
 
  // 4. Trajets (Futurs et Passés)

  for (const vehicle of vehicles) {

    const driverId = vehicle.ownerId;

    // Créer 3 trajets par conducteur

    for (let i = 0; i < 3; i++) {

      const isPast = i === 0;

      const distance = random.number(50, 250);

      await prisma.trip.create({

        data: {

          departureCity: random.element(quebecData.cities),

          arrivalCity: random.element(quebecData.cities),

          departureTime: isPast ? random.pastDate(10) : random.futureDate(10),

          availableSeats: vehicle.seats - 1,

          pricePerSeat: random.number(15, 45),

          distanceKm: distance,

          durationMin: Math.round(distance * 0.8),

          driverId,

          vehicleId: vehicle.id,

          co2SavedPerPass: random.number(5, 15, 2),

          description: "Trajet confortable et écologique."

        }

      });

    }

  }
 
  const trips = await prisma.trip.findMany();
 
  // 5. Réservations et Avis

  for (const trip of trips) {

    const tripPassengers = random.elements(passengers, random.number(1, 3));

    for (const passenger of tripPassengers) {

      const isPast = trip.departureTime < new Date();

      const status = isPast ? BookingStatus.ACCEPTED : random.element([BookingStatus.ACCEPTED, BookingStatus.PENDING]);
 
      const booking = await prisma.booking.create({

        data: {

          status,

          tripId: trip.id,

          passengerId: passenger.id

        }

      });
 
      if (isPast && status === BookingStatus.ACCEPTED) {

        // Ajouter un avis

        const rev = random.element(quebecData.reviews);

        await prisma.review.create({

          data: {

            rating: rev.rating,

            comment: rev.comment,

            tripId: trip.id,

            reviewerId: passenger.id,

            revieweeId: trip.driverId

          }

        });

      }

    }

  }
 
  console.log('✅ Seeding terminé avec succès !');

}
 
main()

  .catch((e) => {

    console.error(e);

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });