import { useMemo } from "react";
import { MapPin } from "lucide-react";

export const MockMap = ({ appointments = [], clients = {} }) => {
  // Generate pseudo-random positions for pins based on address hash
  const pinPositions = useMemo(() => {
    return appointments.map((appt, idx) => {
      const hash = appt.property_address
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Generate positions with some padding from edges
      const x = 10 + (hash % 70) + (idx * 5) % 15;
      const y = 15 + ((hash * 7) % 60) + (idx * 8) % 20;
      
      return { x: Math.min(x, 85), y: Math.min(y, 75) };
    });
  }, [appointments]);

  // Generate SVG path for route lines
  const routePath = useMemo(() => {
    if (pinPositions.length < 2) return "";
    
    let path = `M ${pinPositions[0].x}% ${pinPositions[0].y}%`;
    for (let i = 1; i < pinPositions.length; i++) {
      path += ` L ${pinPositions[i].x}% ${pinPositions[i].y}%`;
    }
    return path;
  }, [pinPositions]);

  if (appointments.length === 0) {
    return (
      <div className="mock-map flex items-center justify-center" data-testid="mock-map-empty">
        <div className="text-center">
          <MapPin className="mx-auto text-neutral-300 mb-2" size={48} />
          <p className="text-neutral-400 text-sm">Add appointments to see route</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mock-map relative"
      style={{
        backgroundImage: `
          linear-gradient(rgba(229, 231, 235, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(229, 231, 235, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
      data-testid="mock-map"
    >
      {/* Route lines */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d={routePath}
          className="route-line"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Map pins */}
      {appointments.map((appt, idx) => {
        const pos = pinPositions[idx];
        const client = clients[appt.client_id];
        
        return (
          <div
            key={appt.id}
            className="absolute group"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -100%)",
            }}
            data-testid={`map-pin-${idx}`}
          >
            {/* Pin */}
            <div className="map-pin">
              <span className="map-pin-number">{idx + 1}</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-white shadow-float px-3 py-2 whitespace-nowrap border border-neutral-100">
                <p className="font-medium text-sm">{client?.name || "Client"}</p>
                <p className="text-xs text-neutral-500 max-w-[200px] truncate">
                  {appt.property_address}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-[#D3AF37]">{appt.start_time}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 ${appt.is_open_house ? 'badge-open-house' : 'badge-private'}`}>
                    {appt.is_open_house ? 'Open House' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 border border-neutral-200">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 font-semibold">Route Order</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#D3AF37] rounded-full" />
            <span className="text-xs">Start</span>
          </div>
          <div className="flex-1 h-px bg-[#D3AF37] border-dashed" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#D3AF37] rounded-full" />
            <span className="text-xs">End</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 border border-neutral-200">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
          {appointments.length} Stops
        </p>
      </div>
    </div>
  );
};

export default MockMap;
