import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom gold marker icon
const createNumberedIcon = (number) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #D3AF37;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); font-weight: bold; font-size: 12px;">${number}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

export const RealMap = ({ appointments = [], clients = {} }) => {
  // Filter appointments with valid coordinates
  const validAppointments = useMemo(() => {
    return appointments.filter(
      (appt) => appt.latitude && appt.longitude && 
               !isNaN(appt.latitude) && !isNaN(appt.longitude)
    );
  }, [appointments]);

  // Get positions for bounds calculation
  const positions = useMemo(() => {
    return validAppointments.map((appt) => [appt.latitude, appt.longitude]);
  }, [validAppointments]);

  // Create route line coordinates
  const routeLine = useMemo(() => {
    return validAppointments.map((appt) => [appt.latitude, appt.longitude]);
  }, [validAppointments]);

  // Default center (US center) if no appointments
  const defaultCenter = [39.8283, -98.5795];
  const center = positions.length > 0 ? positions[0] : defaultCenter;

  if (appointments.length === 0) {
    return (
      <div 
        className="h-[400px] bg-neutral-100 flex items-center justify-center"
        data-testid="real-map-empty"
      >
        <div className="text-center">
          <MapPin className="mx-auto text-neutral-300 mb-2" size={48} />
          <p className="text-neutral-400 text-sm">Add appointments to see route on map</p>
        </div>
      </div>
    );
  }

  if (validAppointments.length === 0) {
    return (
      <div 
        className="h-[400px] bg-neutral-100 flex items-center justify-center"
        data-testid="real-map-no-coords"
      >
        <div className="text-center">
          <MapPin className="mx-auto text-amber-400 mb-2" size={48} />
          <p className="text-neutral-500 text-sm">Addresses need validation</p>
          <p className="text-neutral-400 text-xs mt-1">Edit appointments to validate addresses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] relative" data-testid="real-map">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Fit bounds to show all markers */}
        {positions.length > 0 && <FitBounds positions={positions} />}
        
        {/* Route line */}
        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            color="#D3AF37"
            weight={3}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
        
        {/* Markers */}
        {validAppointments.map((appt, idx) => {
          const client = clients[appt.client_id];
          return (
            <Marker
              key={appt.id}
              position={[appt.latitude, appt.longitude]}
              icon={createNumberedIcon(idx + 1)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-semibold text-sm mb-1">
                    {client?.name || "Client"}
                  </p>
                  <p className="text-xs text-neutral-600 mb-2">
                    {appt.property_address}, {appt.city}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[#D3AF37] font-semibold">
                      {appt.start_time}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] ${
                      appt.is_open_house 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {appt.is_open_house ? "Open House" : "Private"}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 border border-neutral-200 z-[1000]">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
          Route: {validAppointments.length} stops
        </p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#D3AF37] rounded-full" />
          <span className="text-xs">Start</span>
          <div className="flex-1 h-px bg-[#D3AF37] border-dashed mx-1" />
          <div className="w-3 h-3 bg-[#D3AF37] rounded-full" />
          <span className="text-xs">End</span>
        </div>
      </div>
    </div>
  );
};

export default RealMap;
