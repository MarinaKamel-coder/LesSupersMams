import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';
import type { DashboardData } from '../types/user';
import { 
  Leaf, 
  Car, 
  DollarSign, 
  Award, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  TreeDeciduous as Tree 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await userService.getDashboardData();
        setData(result);
      } catch (err) {
        setError("Erreur lors de la récupération des données");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">
      Chargement de votre impact...
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
      {error || "Une erreur est survenue"}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Voici un résumé de votre impact et de vos activités au Québec.</p>
      </header>

      {/* --- Cartes de Statistiques --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CO2 Saved */}
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 transition-transform hover:scale-105">
          <div className="flex justify-between items-start text-emerald-600">
            <Leaf size={28} />
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-200 px-2 py-1 rounded">Éco</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-emerald-900">{data.stats.totalCO2Saved} kg</h3>
            <p className="text-sm text-emerald-700 font-medium">CO2 économisé</p>
          </div>
        </div>

        {/* Tree Equivalent */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 transition-transform hover:scale-105">
          <Tree size={28} className="text-blue-600" />
          <div className="mt-4">
            <h3 className="text-3xl font-black text-blue-900">{data.stats.co2Equivalent.treesPlanted}</h3>
            <p className="text-sm text-blue-700 font-medium">Arbres sauvés (équiv.)</p>
          </div>
        </div>

        {/* Money Earned */}
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 transition-transform hover:scale-105">
          <DollarSign size={28} className="text-amber-600" />
          <div className="mt-4">
            <h3 className="text-3xl font-black text-amber-900">{data.stats.moneyEarned} $</h3>
            <p className="text-sm text-amber-700 font-medium">Gains totaux</p>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 transition-transform hover:scale-105">
          <Award size={28} className="text-indigo-600" />
          <div className="mt-4">
            <h3 className="text-3xl font-black text-indigo-900">#{data.leaderboardPosition}</h3>
            <p className="text-sm text-indigo-700 font-medium">Rang communauté</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Prochains Trajets --- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              Vos prochains trajets
            </h2>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {data.upcomingTrips.length > 0 ? (
              data.upcomingTrips.map((trip) => (
                <div key={trip.id} className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{trip.departureCity} → {trip.arrivalCity}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(trip.departureTime).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-emerald-600">{trip.pricePerSeat} $</span>
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-gray-400">Aucun trajet prévu prochainement.</p>
            )}
          </div>
        </div>

        {/* --- Badges & Notifications --- */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Vos Badges Éco
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge, i) => (
                <span key={i} className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <h3 className="font-bold text-lg mb-2">Demandes en attente</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-emerald-100 text-sm">Passagers à confirmer</p>
                <p className="text-3xl font-black">{data.pendingRequests.received}</p>
              </div>
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors">
                Gérer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};