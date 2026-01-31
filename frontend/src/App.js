import "@/App.css";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect, createContext, useContext } from "react";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import RouteOptimizerPage from "@/pages/RouteOptimizerPage";
import NotesPage from "@/pages/NotesPage";
import SettingsPage from "@/pages/SettingsPage";
import Sidebar from "@/components/Sidebar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Auth Provider - Auto guest login
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkOrCreateAuth = async () => {
    try {
      const token = localStorage.getItem("session_token");
      
      // If we have a token, verify it
      if (token) {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } else {
          // Token invalid, clear it
          localStorage.removeItem("session_token");
        }
      }

      // No valid token - create guest account
      await createGuestAccount();
    } catch (error) {
      console.error("Auth check failed:", error);
      // Try to create guest on error
      await createGuestAccount();
    }
  };

  const createGuestAccount = async () => {
    try {
      const response = await fetch(`${API}/auth/guest`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session_token) {
          localStorage.setItem("session_token", data.session_token);
        }
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to create guest account:", error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (sessionId) => {
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
      // Create new guest account after logout
      await createGuestAccount();
    }
  };

  useEffect(() => {
    checkOrCreateAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Handler for Google login
const AuthCallback = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);

      if (sessionIdMatch) {
        await loginWithGoogle(sessionIdMatch[1]);
      }
      
      // Clear hash and go to dashboard
      window.history.replaceState(null, "", "/");
      navigate("/", { replace: true });
      setProcessing(false);
    };

    processAuth();
  }, [loginWithGoogle, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-xl font-semibold text-[#0A0A0A] mb-2">
            Signing you in...
          </h2>
        </div>
      </div>
    );
  }

  return null;
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-neutral-500">Loading Estate Scheduler...</p>
    </div>
  </div>
);

// App Layout
const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

// Main App Content
const AppContent = () => {
  const { loading } = useAuth();

  // Handle OAuth callback
  if (window.location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/optimize" element={<RouteOptimizerPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
