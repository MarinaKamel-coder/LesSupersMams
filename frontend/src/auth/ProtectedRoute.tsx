import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ redirectTo = "/login" }: { redirectTo?: string }) {
	const { token, isLoading } = useAuth();

	if (isLoading) return <p>Chargement...</p>;
	if (!token) return <Navigate to={redirectTo} replace />;

	return <Outlet />;
}
