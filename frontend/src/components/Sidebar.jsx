import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Route, FileText } from "lucide-react";

export const Sidebar = () => {
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/appointments", icon: Calendar, label: "Appointments" },
    { path: "/optimize", icon: Route, label: "Route Optimizer" },
    { path: "/notes", icon: FileText, label: "House Notes" },
  ];

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D3AF37] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-white font-medium">John Doe</p>
            <p className="text-xs text-neutral-400">Real Estate Agent</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
