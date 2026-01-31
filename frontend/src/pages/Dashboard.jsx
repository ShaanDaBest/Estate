import { useState, useEffect } from "react";
import apiClient from "@/utils/api";
import { Calendar, MapPin, Clock, Users, Home, Navigation } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaApple, FaAndroid } from "react-icons/fa";
import RealMap from "@/components/RealMap";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, apptsRes, clientsRes] = await Promise.all([
        apiClient.get(`/dashboard/stats?date=${dateStr}`),
        apiClient.get(`/appointments?date=${dateStr}`),
        apiClient.get(`/clients`),
      ]);
      
      setStats(statsRes.data);
      setAppointments(apptsRes.data);
      
      // Create client lookup
      const clientMap = {};
      clientsRes.data.forEach(c => clientMap[c.id] = c);
      setClients(clientMap);
      
      // Auto-optimize route
      if (apptsRes.data.length > 0) {
        const optimizeRes = await apiClient.post(`/optimize-route?date=${dateStr}`);
        setOptimizedRoute(optimizeRes.data);
      } else {
        setOptimizedRoute(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (appt) => {
    if (appt.is_open_house) {
      return <Badge className="badge-open-house">Open House</Badge>;
    }
    return <Badge className="badge-private">Private</Badge>;
  };

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Daily Schedule</h1>
          <p className="page-subtitle">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              data-testid="date-picker-trigger"
            >
              <Calendar size={16} />
              {format(selectedDate, "MMM d")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Stats Row */}
        <Card className="col-span-3 card-luxury card-hover" data-testid="stat-appointments">
          <CardContent className="stat-card">
            <Calendar className="text-[#D3AF37] mb-3" size={24} />
            <div className="stat-value">{stats?.total_appointments || 0}</div>
            <div className="stat-label">Appointments Today</div>
          </CardContent>
        </Card>

        <Card className="col-span-3 card-luxury card-hover" data-testid="stat-open-houses">
          <CardContent className="stat-card">
            <Home className="text-emerald-500 mb-3" size={24} />
            <div className="stat-value">{stats?.open_houses || 0}</div>
            <div className="stat-label">Open Houses</div>
          </CardContent>
        </Card>

        <Card className="col-span-3 card-luxury card-hover" data-testid="stat-private">
          <CardContent className="stat-card">
            <Users className="text-blue-500 mb-3" size={24} />
            <div className="stat-value">{stats?.private_viewings || 0}</div>
            <div className="stat-label">Private Viewings</div>
          </CardContent>
        </Card>

        <Card className="col-span-3 card-luxury card-hover" data-testid="stat-clients">
          <CardContent className="stat-card">
            <Users className="text-purple-500 mb-3" size={24} />
            <div className="stat-value">{stats?.total_clients || 0}</div>
            <div className="stat-label">Total Clients</div>
          </CardContent>
        </Card>

        {/* Route Map - Large */}
        <Card className="col-span-8 row-span-2 card-luxury" data-testid="route-map-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Navigation className="text-[#D3AF37]" size={20} />
              Optimized Route
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RealMap 
              appointments={optimizedRoute?.appointments || []} 
              clients={clients}
            />
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="col-span-4 row-span-2 card-luxury" data-testid="schedule-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="text-[#D3AF37]" size={20} />
              Today's Route
            </CardTitle>
            {optimizedRoute && (
              <p className="text-xs text-neutral-500 mt-1">
                Est. finish: <span className="font-mono text-[#D3AF37]">{optimizedRoute.finish_time_estimate}</span>
                {" | "}
                <span className="font-mono">{optimizedRoute.total_distance_estimate} mi</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-neutral-400">Loading...</div>
            ) : optimizedRoute?.appointments?.length > 0 ? (
              optimizedRoute.appointments.map((appt, idx) => {
                const client = clients[appt.client_id];
                return (
                  <div 
                    key={appt.id} 
                    className="schedule-item"
                    data-testid={`schedule-item-${idx}`}
                  >
                    <div className="schedule-order">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {client?.name || "Unknown Client"}
                        </span>
                        {client?.phone_type === "apple" ? (
                          <FaApple className="phone-apple" size={14} />
                        ) : client?.phone_type === "android" ? (
                          <FaAndroid className="phone-android" size={14} />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin size={12} />
                        <span className="truncate">{appt.property_address}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="schedule-time">{appt.start_time}</span>
                        {getStatusBadge(appt)}
                        <Badge variant="outline" className="text-[10px]">
                          {appt.time_at_house} min
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Calendar className="mx-auto text-neutral-300 mb-3" size={40} />
                <p className="text-neutral-400 text-sm">No appointments scheduled</p>
                <p className="text-neutral-300 text-xs mt-1">Add appointments to see your optimized route</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        {optimizedRoute && optimizedRoute.appointments.length > 0 && (
          <Card className="col-span-12 card-luxury" data-testid="route-summary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">Total Time</span>
                    <p className="font-mono text-lg font-semibold">{optimizedRoute.total_estimated_time} min</p>
                  </div>
                  <div className="w-px h-10 bg-neutral-200" />
                  <div>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">Distance</span>
                    <p className="font-mono text-lg font-semibold">{optimizedRoute.total_distance_estimate} miles</p>
                  </div>
                  <div className="w-px h-10 bg-neutral-200" />
                  <div>
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">Finish By</span>
                    <p className="font-mono text-lg font-semibold text-[#D3AF37]">{optimizedRoute.finish_time_estimate}</p>
                  </div>
                </div>
                <Button 
                  className="btn-gold"
                  onClick={fetchData}
                  data-testid="refresh-route-btn"
                >
                  Refresh Route
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
