import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon broken images in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Risk zone data for major Indian cities
const riskZones = [
  // Mumbai
  { lat: 19.076, lng: 72.877, risk: "high",   area: "Dharavi, Mumbai",       reason: "Heavy flooding, poor drainage" },
  { lat: 19.033, lng: 73.030, risk: "medium", area: "Navi Mumbai",            reason: "Moderate rainfall risk" },
  { lat: 19.121, lng: 72.858, risk: "low",    area: "Andheri, Mumbai",        reason: "Good infrastructure" },
  { lat: 18.939, lng: 72.835, risk: "high",   area: "South Mumbai",           reason: "Tidal flooding risk" },
  { lat: 19.175, lng: 72.941, risk: "medium", area: "Thane",                  reason: "Elevated AQI levels" },
  // Delhi
  { lat: 28.704, lng: 77.102, risk: "high",   area: "Rohini, Delhi",          reason: "Severe AQI: 320+ pollution" },
  { lat: 28.635, lng: 77.224, risk: "high",   area: "Lajpat Nagar, Delhi",   reason: "High traffic & pollution" },
  { lat: 28.549, lng: 77.273, risk: "medium", area: "Faridabad",              reason: "Moderate pollution risk" },
  { lat: 28.459, lng: 77.026, risk: "low",    area: "Gurugram",               reason: "Better air quality" },
  { lat: 28.703, lng: 77.303, risk: "medium", area: "Noida",                  reason: "Construction dust, AQI 180" },
  // Bangalore
  { lat: 12.971, lng: 77.594, risk: "medium", area: "Central Bangalore",      reason: "Traffic congestion risk" },
  { lat: 12.926, lng: 77.677, risk: "low",    area: "Whitefield, Bangalore",  reason: "Low risk conditions" },
  { lat: 13.010, lng: 77.551, risk: "high",   area: "Yelahanka, Bangalore",   reason: "Waterlogging during rain" },
  // Chennai
  { lat: 13.082, lng: 80.270, risk: "high",   area: "North Chennai",          reason: "Cyclone & flood prone" },
  { lat: 12.950, lng: 80.145, risk: "medium", area: "South Chennai",          reason: "Some flooding risk" },
  // Hyderabad
  { lat: 17.385, lng: 78.486, risk: "medium", area: "Hyderabad Central",      reason: "Moderate weather risk" },
  { lat: 17.447, lng: 78.378, risk: "low",    area: "Hitec City, Hyderabad",  reason: "Low operational risk" },
];

const riskConfig = {
  high:   { color: "#ef4444", fillColor: "#fca5a5", label: "High Risk",   radius: 18000 },
  medium: { color: "#f59e0b", fillColor: "#fde68a", label: "Medium Risk", radius: 15000 },
  low:    { color: "#22c55e", fillColor: "#bbf7d0", label: "Low Risk",    radius: 12000 },
};

export function RiskMap() {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      scrollWheelZoom: true,
    });
    mapInst.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    riskZones.forEach((zone) => {
      const cfg = riskConfig[zone.risk as keyof typeof riskConfig];

      L.circle([zone.lat, zone.lng], {
        color: cfg.color,
        fillColor: cfg.fillColor,
        fillOpacity: 0.5,
        weight: 2,
        radius: cfg.radius,
      })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${zone.area}</div>
            <div style="display:inline-block;background:${cfg.color};color:white;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;margin-bottom:6px">
              ${cfg.label}
            </div>
            <div style="font-size:12px;color:#555">${zone.reason}</div>
          </div>`,
          { maxWidth: 220 }
        );

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;border-radius:50%;background:${cfg.color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      L.marker([zone.lat, zone.lng], { icon })
        .addTo(map)
        .bindTooltip(zone.area, { direction: "top", offset: [0, -8] });
    });

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        style={{ height: "420px", width: "100%", borderRadius: "12px", overflow: "hidden" }}
        className="border border-gray-200 shadow-inner"
      />
      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 text-sm pt-1">
        {Object.entries(riskConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{ backgroundColor: cfg.fillColor, borderColor: cfg.color }}
            />
            <span className="text-gray-700 font-medium">{cfg.label}</span>
          </div>
        ))}
        <span className="text-gray-400 text-xs ml-auto">Click on a zone for details</span>
      </div>
    </div>
  );
}
