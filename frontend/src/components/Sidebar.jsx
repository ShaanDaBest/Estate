import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Route, FileText, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/App";
import { FcGoogle } from "react-icons/fc";

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/appointments", icon: Calendar, label: "Appointments" },
    { path: "/optimize", icon: Route, label: "Route Optimizer" },
    { path: "/notes", icon: FileText, label: "House Notes" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out - new guest session created");
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const isGuest = user?.is_guest || user?.email?.includes("@guest.local");

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar-brand">
        <h1 className="font-display text-xl text-white font-semibold">Estate</h1>
        <p className="text-xs text-neutral-400 mt-1">Scheduler Pro</p>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
            data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        {/* User Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isGuest ? "bg-neutral-600" : "bg-[#D3AF37]"
              }`}>
                {isGuest ? (
                  <User className="text-white" size={18} />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </span>
                )}
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {isGuest ? "Guest User" : user?.name || "Loading..."}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {isGuest ? "Sign in to save data" : user?.email || ""}
              </p>
            </div>
          </div>
          {!isGuest && (
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Logout"
              data-testid="logout-btn"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Sign in with Google button for guests */}
        {isGuest && (
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white text-neutral-800 text-sm font-medium rounded hover:bg-neutral-100 transition-colors"
            data-testid="google-signin-sidebar-btn"
          >
            <FcGoogle size={18} />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
