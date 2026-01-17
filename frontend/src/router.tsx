import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { HomePage } from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateTripPage } from "./pages/CreateTripPage";
import { AdministrationPage } from "./pages/AdministrationPage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { MessagePage } from "./pages/MessagePage.tsx";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import { TripDetailsPage } from "./pages/TripDetailsPage";
import { ReviewPage } from "./pages/reviewPage";
import {MyProfilePage} from "./pages/MyProfilePage";
import { MyTripsPage } from "./pages/MyTripsPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "/login", element: <LoginPage /> },
            { path: "/booking", element: <BookingPage /> },
            { path: "/trip/:id", element: <TripDetailsPage /> },
            { path: "/profile/:id", element: <PublicProfilePage /> },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "/dashboard", element: <DashboardPage /> },
                    { path: "/create-trip", element: <CreateTripPage /> },
                    { path: "/admin", element: <AdministrationPage /> },
                    { path: "/vehicles", element: <VehiclesPage /> },
                    { path: "/messages", element: <MessagePage /> },
                    { path: "/messages/:tripId", element: <MessagePage /> },
                    { path: "/my-bookings", element: <MyBookingsPage /> },
                    { path: "/my-trips", element: <MyTripsPage /> },
                    { path: "/reviews", element: <ReviewPage /> },
                    { path: "/my-profile", element: <MyProfilePage /> },                   
                ],                
            },
        ],
    },
]);
