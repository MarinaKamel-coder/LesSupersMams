import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateTripPage } from "./pages/CreateTripPage";

export const router = createBrowserRouter([
    {
        
         path: "/",
         element: <AppLayout />, 
         children: [
            { index: true, element: <HomePage /> },
            { path: "/login", element: <LoginPage /> },
                        {
                            element: <ProtectedRoute />,
                            children: [
                                { path: "/dashboard", element: <DashboardPage /> },
                                { path: "/create-trip", element: <CreateTripPage /> },
                            ],
                        },
            // {
            // path: "/vehicles", 
            // element: (
            //   <ProtectedRoute>
            //       <VehiclesPage />
            //   </ProtectedRoute>
            //   ), 
            // }, 
        ], 
    }, 
]);
