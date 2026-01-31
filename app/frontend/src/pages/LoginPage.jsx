import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, MapPin, Calendar, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          navigate("/", { replace: true });
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="login-page">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(211, 175, 55, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(211, 175, 55, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        
        {/* Logo */}
        <div className="relative z-10">
          <h1 className="font-display text-4xl text-white font-bold">Estate</h1>
          <p className="text-neutral-400 mt-1">Scheduler Pro</p>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#D3AF37]/10 flex items-center justify-center flex-shrink-0">
              <Route className="text-[#D3AF37]" size={24} />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Smart Route Optimization</h3>
              <p className="text-neutral-400 text-sm">Customize priorities to find the fastest route through your daily appointments</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#D3AF37]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="text-[#D3AF37]" size={24} />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Seamless Scheduling</h3>
              <p className="text-neutral-400 text-sm">Manage open houses and private viewings with ease</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#D3AF37]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="text-[#D3AF37]" size={24} />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Property Notes</h3>
              <p className="text-neutral-400 text-sm">Keep detailed notes for each property, separate from client data</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-neutral-500 text-sm">
            © 2026 Estate Scheduler Pro. Built for elite real estate agents.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F9FAFB]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <h1 className="font-display text-3xl font-bold text-[#0A0A0A]">Estate</h1>
            <p className="text-neutral-500 mt-1">Scheduler Pro</p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-semibold text-[#0A0A0A] mb-2">
              Welcome Back
            </h2>
            <p className="text-neutral-500">
              Sign in to manage your daily schedule
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white border-2 border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-[#D3AF37] transition-colors duration-200 gap-3 text-base font-medium"
            data-testid="google-signin-btn"
          >
            <FcGoogle size={24} />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F9FAFB] px-4 text-neutral-400 tracking-wider">
                Secure Authentication
              </span>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            {[
              "Route optimization for up to 5+ clients daily",
              "Track open houses and private viewings",
              "Manage client contacts with phone type indicators",
              "Property-specific notes and follow-ups",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D3AF37]" />
                {feature}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-neutral-400 mt-10">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
