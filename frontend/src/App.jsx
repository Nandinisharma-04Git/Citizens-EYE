import { Navigate, Route, Routes } from "react-router-dom";
import CitizenDashboard from "./pages/CitizenDashboard.jsx";
import OfficerDashboard from "./pages/OfficerDashboard.jsx";
import Login from "./pages/Login.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    const redirectPath = user.role === "Officer" ? "/officer" : "/citizen";
    return <Navigate to={redirectPath} replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === "Officer" ? "/officer" : "/citizen"} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/citizen"
        element={
          <ProtectedRoute role="Citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer"
        element={
          <ProtectedRoute role="Officer">
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


