import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect, createContext, useContext } from "react";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import RouteOptimizerPage from "@/pages/RouteOptimizerPage";
import NotesPage from "@/pages/NotesPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import Sidebar from "@/components/Sidebar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API}/auth/me`, {
        credentials: "include",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("session_token");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("session_token");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (sessionId) => {
    try {
      const response = await fetch(`${API}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await response.json();
      
      if (data.session_token) {
        localStorage.setItem("session_token", data.session_token);
      }
      
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("session_token");
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("session_token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Handler
const AuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);

      if (!sessionIdMatch) {
        console.error("No session_id found");
        navigate("/login", { replace: true });
        return;
      }

      const success = await login(sessionIdMatch[1]);
      
      // Clear hash from URL
      window.history.replaceState(null, "", window.location.pathname);
      
      if (success) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
      setProcessing(false);
    };

    processAuth();
  }, [login, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-xl font-semibold text-[#0A0A0A] mb-2">
            Signing you in...
          </h2>
          <p className="text-neutral-500">Please wait</p>
        </div>
      </div>
    );
  }

  return null;
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App Layout
const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

// Router
function AppRouter() {
  const location = useLocation();

  // Handle OAuth callback
  if (window.location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><AppLayout><ClientsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><AppLayout><AppointmentsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/optimize" element={<ProtectedRoute><AppLayout><RouteOptimizerPage /></AppLayout></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><AppLayout><NotesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
