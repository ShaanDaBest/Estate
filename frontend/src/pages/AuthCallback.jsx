import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error("No session_id found in URL");
          navigate("/login", { replace: true });
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for session_token
        const response = await fetch(`${API}/auth/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to authenticate");
        }

        const userData = await response.json();

        // Clear the hash from URL and navigate to dashboard with user data
        navigate("/", { replace: true, state: { user: userData } });
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login", { replace: true });
      }
    };

    processAuth();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="font-display text-xl font-semibold text-[#0A0A0A] mb-2">
          Signing you in...
        </h2>
        <p className="text-neutral-500">Please wait while we set up your account</p>
      </div>
    </div>
  );
}
