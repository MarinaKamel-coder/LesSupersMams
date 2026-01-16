import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
 
export const router = createBrowserRouter([
    {
       
         path: "/",
         element: <AppLayout />,
         children: [
            { index: true, element: <HomePage /> },
            { path: "/login", element: <LoginPage /> },
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
 