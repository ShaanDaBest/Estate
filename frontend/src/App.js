import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import RouteOptimizerPage from "@/pages/RouteOptimizerPage";
import NotesPage from "@/pages/NotesPage";
import Sidebar from "@/components/Sidebar";

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/optimize" element={<RouteOptimizerPage />} />
            <Route path="/notes" element={<NotesPage />} />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
