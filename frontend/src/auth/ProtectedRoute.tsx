import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
