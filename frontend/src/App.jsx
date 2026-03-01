import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import PatientDashboard from "./components/dashboards/PatientDashboard";
import DoctorDashboard from "./components/dashboards/DoctorDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import "./App.css";

// Defined outside AppContent to avoid recreation on every render
function ProtectedRoute({ children, requiredRole, isAuthenticated, userRole }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={`/dashboard/${userRole}`} replace />;
  }
  return children;
}

function AppContent() {
  // Lazy initializer reads localStorage once on mount — no useEffect needed
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user");
    if (token && role) {
      return {
        isAuthenticated: true,
        userRole: role,
        userData: user ? JSON.parse(user) : null,
      };
    }
    return { isAuthenticated: false, userRole: null, userData: null };
  });
  const navigate = useNavigate();

  const handleLogin = (data) => {
    if (!data || !data.role) {
      console.error("Invalid login data received:", data);
      return;
    }

    const role = data.role.toLowerCase();
    console.log("Login successful, redirecting to dashboard:", role);

    // Update state with single setState call
    setAuthState({
      isAuthenticated: true,
      userRole: role,
      userData: data.user || {},
    });

    // Redirect immediately to appropriate dashboard
    const dashboardMap = {
      patient: "/dashboard/patient",
      doctor: "/dashboard/doctor",
      admin: "/dashboard/admin",
    };

    const dashboardPath = dashboardMap[role];
    if (dashboardPath) {
      navigate(dashboardPath);
    } else {
      console.error("Unknown role:", role);
      navigate("/login");
    }
  };

  const handleRegister = () => {
    // Redirect to login after successful registration
    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      userData: null,
    });
    navigate("/login");
  };

  const ProtectedProps = {
    isAuthenticated: authState.isAuthenticated,
    userRole: authState.userRole,
  };

  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
      <Route
        path="/register"
        element={<RegisterForm onRegister={handleRegister} />}
      />

      {/* Dashboard Routes */}
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute requiredRole="patient" {...ProtectedProps}>
            <PatientDashboard
              user={authState.userData}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/doctor"
        element={
          <ProtectedRoute requiredRole="doctor" {...ProtectedProps}>
            <DoctorDashboard
              user={authState.userData}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute requiredRole="admin" {...ProtectedProps}>
            <AdminDashboard user={authState.userData} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
