import { useState, useEffect } from "react";
import apiClient from "@/utils/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Reorder } from "framer-motion";
import { GripVertical, Calendar, Route, Clock, MapPin, Zap, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RealMap from "@/components/RealMap";


const defaultPriorities = [
  { key: "open_house", label: "Open House First", weight: 5, enabled: true },
  { key: "appointment_time", label: "Appointment Time", weight: 4, enabled: true },
  { key: "distance", label: "Shortest Distance", weight: 3, enabled: true },
  { key: "time_at_house", label: "Time at House", weight: 2, enabled: true },
  { key: "city_cluster", label: "Same City Cluster", weight: 1, enabled: true },
];

export default function RouteOptimizerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [priorities, setPriorities] = useState(defaultPriorities);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchPriorities();
    fetchClientsAndOptimize();
  }, [selectedDate]);

  const fetchPriorities = async () => {
    try {
      const res = await apiClient.get(`/priorities`);
      if (res.data.priorities) {
        setPriorities(res.data.priorities);
      }
    } catch (error) {
      console.error("Failed to fetch priorities");
    }
  };

  const fetchClientsAndOptimize = async () => {
    setLoading(true);
    try {
      const [clientsRes, optimizeRes] = await Promise.all([
        apiClient.get(`/clients`),
        apiClient.post(`/optimize-route?date=${dateStr}`),
      ]);
      
      const clientMap = {};
      clientsRes.data.forEach((c) => (clientMap[c.id] = c));
      setClients(clientMap);
      setOptimizedRoute(optimizeRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePriorities = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/priorities`, { priorities });
      toast.success("Priorities saved");
      // Re-optimize with new priorities
      fetchClientsAndOptimize();
    } catch (error) {
      toast.error("Failed to save priorities");
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityToggle = (key) => {
    setPriorities((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleWeightChange = (key, value) => {
    setPriorities((prev) =>
      prev.map((p) => (p.key === key ? { ...p, weight: value[0] } : p))
    );
  };

  const handleReorder = (newOrder) => {
    setPriorities(newOrder);
  };

  const getPriorityIcon = (key) => {
    switch (key) {
      case "open_house": return "🏠";
      case "appointment_time": return "⏰";
      case "distance": return "📍";
      case "time_at_house": return "⏱️";
      case "city_cluster": return "🏙️";
      default: return "📋";
    }
  };

  return (
    <div data-testid="route-optimizer-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Route Optimizer</h1>
          <p className="page-subtitle">
            Customize priorities to optimize your daily route
          </p>
        </div>
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="optimizer-date-picker">
                <Calendar size={16} />
                {format(selectedDate, "MMM d, yyyy")}
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
          <Button
            className="btn-gold gap-2"
            onClick={handleSavePriorities}
            disabled={saving}
            data-testid="save-priorities-btn"
          >
            <Zap size={16} />
            {saving ? "Saving..." : "Apply & Optimize"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Settings */}
        <Card className="lg:col-span-5 card-luxury" data-testid="priorities-card">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Settings2 className="text-[#D3AF37]" size={20} />
              Priority Settings
            </CardTitle>
            <p className="text-xs text-neutral-500 mt-1">
              Drag to reorder • Toggle to enable/disable • Adjust weight for importance
            </p>
          </CardHeader>
          <CardContent>
            <Reorder.Group
              axis="y"
              values={priorities}
              onReorder={handleReorder}
              className="space-y-3"
            >
              {priorities.map((priority) => (
                <Reorder.Item
                  key={priority.key}
                  value={priority}
                  className={`priority-item ${!priority.enabled ? "opacity-50" : ""}`}
                  data-testid={`priority-item-${priority.key}`}
                >
                  <div className="drag-handle p-1">
                    <GripVertical size={18} className="text-neutral-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPriorityIcon(priority.key)}</span>
                        <span className="font-medium text-sm">{priority.label}</span>
                      </div>
                      <Switch
                        checked={priority.enabled}
                        onCheckedChange={() => handlePriorityToggle(priority.key)}
                        data-testid={`priority-toggle-${priority.key}`}
                      />
                    </div>
                    
                    {priority.enabled && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500 w-12">Weight:</span>
                        <Slider
                          value={[priority.weight]}
                          onValueChange={(value) => handleWeightChange(priority.key, value)}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1"
                          data-testid={`priority-slider-${priority.key}`}
                        />
                        <Badge variant="outline" className="font-mono text-xs w-8 justify-center">
                          {priority.weight}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </CardContent>
        </Card>

        {/* Optimized Route Map */}
        <Card className="lg:col-span-7 card-luxury" data-testid="optimized-map-card">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Route className="text-[#D3AF37]" size={20} />
              Optimized Route
            </CardTitle>
            {optimizedRoute && optimizedRoute.appointments.length > 0 && (
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-neutral-400" />
                  <span className="text-sm font-mono">{optimizedRoute.total_estimated_time} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-neutral-400" />
                  <span className="text-sm font-mono">{optimizedRoute.total_distance_estimate} mi</span>
                </div>
                <div>
                  <span className="text-sm">Finish by </span>
                  <span className="text-sm font-mono text-[#D3AF37] font-semibold">
                    {optimizedRoute.finish_time_estimate}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-neutral-400">Optimizing route...</div>
              </div>
            ) : (
              <RealMap
                appointments={optimizedRoute?.appointments || []}
                clients={clients}
              />
            )}
          </CardContent>
        </Card>

        {/* Route Order List */}
        {optimizedRoute && optimizedRoute.appointments.length > 0 && (
          <Card className="lg:col-span-12 card-luxury" data-testid="route-order-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Optimized Visit Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {optimizedRoute.appointments.map((appt, idx) => {
                  const client = clients[appt.client_id];
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-3 bg-neutral-50 px-4 py-3 min-w-[280px]"
                      data-testid={`route-stop-${idx}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#D3AF37] text-white flex items-center justify-center font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{client?.name || "Client"}</p>
                        <p className="text-xs text-neutral-500 truncate">{appt.property_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-[#D3AF37]">{appt.start_time}</p>
                        <p className="text-[10px] text-neutral-400">{appt.time_at_house} min</p>
                      </div>
                      {idx < optimizedRoute.appointments.length - 1 && (
                        <div className="text-neutral-300 text-xl">→</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
