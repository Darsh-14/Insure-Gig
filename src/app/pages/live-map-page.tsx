import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MapPin, Navigation, Shield, AlertTriangle, Wifi, WifiOff, RefreshCw, Crosshair, Zap, Bike, Satellite } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getDistanceFromLatLonInKm } from "../../services/mockApi";
import { loadDisruptionModel, predictDisruption } from "../../services/mlEngine";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const riskZones = [
  // Mumbai
  { lat: 19.076, lng: 72.877, risk: "high", area: "Dharavi, Mumbai", reason: "Heavy flooding, poor drainage" },
  { lat: 19.033, lng: 73.030, risk: "medium", area: "Navi Mumbai", reason: "Moderate rainfall risk" },
  { lat: 19.121, lng: 72.858, risk: "low", area: "Andheri, Mumbai", reason: "Good infrastructure" },
  { lat: 18.961, lng: 72.832, risk: "high", area: "Kurla, Mumbai", reason: "Chronic waterlogging during monsoon" },
  { lat: 19.052, lng: 72.899, risk: "medium", area: "Chembur, Mumbai", reason: "Industrial AQI exposure" },
  // Delhi
  { lat: 28.614, lng: 77.209, risk: "high", area: "Connaught Place, Delhi", reason: "Dense traffic, severe winter fog" },
  { lat: 28.670, lng: 77.103, risk: "high", area: "Rohini, Delhi", reason: "Extreme AQI in winter season" },
  { lat: 28.536, lng: 77.391, risk: "medium", area: "Noida Sector 18", reason: "Heavy peak-hour congestion" },
  { lat: 28.458, lng: 77.027, risk: "low", area: "Gurgaon, Delhi NCR", reason: "Modern drainage, lower flood risk" },
  { lat: 28.700, lng: 77.230, risk: "medium", area: "Burari, Delhi", reason: "Seasonal flooding, uneven drainage" },
  // Bangalore
  { lat: 12.972, lng: 77.595, risk: "medium", area: "MG Road, Bangalore", reason: "Traffic congestion, poor drainage" },
  { lat: 12.934, lng: 77.624, risk: "high", area: "Koramangala, Bangalore", reason: "Repeated flooding, encroached lakes" },
  { lat: 13.010, lng: 77.552, risk: "low", area: "Hebbal, Bangalore", reason: "Elevated terrain, better drainage" },
  { lat: 12.900, lng: 77.499, risk: "medium", area: "Banashankari, Bangalore", reason: "Moderate traffic disruption risk" },
  // Hyderabad
  { lat: 17.385, lng: 78.487, risk: "medium", area: "Secunderabad", reason: "Flash flood risk during heavy rain" },
  { lat: 17.449, lng: 78.381, risk: "high", area: "Kukatpally, Hyderabad", reason: "Waterlogging, high traffic density" },
  { lat: 17.366, lng: 78.476, risk: "low", area: "Banjara Hills, Hyderabad", reason: "Elevated, good road quality" },
  // Chennai
  { lat: 13.083, lng: 80.271, risk: "high", area: "Adyar, Chennai", reason: "Cyclone & coastal flood risk" },
  { lat: 13.052, lng: 80.249, risk: "medium", area: "T Nagar, Chennai", reason: "Congestion, moderate storm drain risk" },
  { lat: 13.142, lng: 80.305, risk: "low", area: "Kolathur, Chennai", reason: "Inland, lower flood exposure" },
  { lat: 13.000, lng: 80.200, risk: "high", area: "Velachery, Chennai", reason: "Severe flooding zone (2015 floods)" },
  // Kolkata
  { lat: 22.573, lng: 88.364, risk: "high", area: "Tiljala, Kolkata", reason: "Severe waterlogging, poor drainage" },
  { lat: 22.519, lng: 88.322, risk: "medium", area: "Behala, Kolkata", reason: "Cyclone Amphan damage prone area" },
  { lat: 22.574, lng: 88.433, risk: "low", area: "Salt Lake, Kolkata", reason: "Planned sector, better infrastructure" },
  // Pune
  { lat: 18.520, lng: 73.857, risk: "high", area: "Sinhagad Road, Pune", reason: "Landslide risk during heavy rain" },
  { lat: 18.530, lng: 73.876, risk: "medium", area: "Shivajinagar, Pune", reason: "Congestion & moderate flood risk" },
  { lat: 18.493, lng: 73.855, risk: "low", area: "Kothrud, Pune", reason: "Well-planned, lower disruption risk" },
  // Ahmedabad
  { lat: 23.022, lng: 72.571, risk: "medium", area: "Maninagar, Ahmedabad", reason: "Flash floods during heavy rain" },
  { lat: 23.071, lng: 72.524, risk: "high", area: "Vatva, Ahmedabad", reason: "Industrial pollution, poor drainage" },
  { lat: 23.033, lng: 72.585, risk: "low", area: "Navrangpura, Ahmedabad", reason: "Central, better infrastructure" },
];

const riskConfig = {
  high: { color: "#dc2626", fillColor: "#f87171", label: "highRisk", radius: 4000 },
  medium: { color: "#d97706", fillColor: "#fbbf24", label: "mediumRisk", radius: 3000 },
  low: { color: "#16a34a", fillColor: "#4ade80", label: "lowRisk", radius: 2000 },
};

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const MODEL_CITIES: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777], Delhi: [28.6139, 77.209], Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867], Chennai: [13.0827, 80.2707], Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567], Ahmedabad: [23.0225, 72.5714],
};

function nearestModelCity(lat: number, lng: number): string {
  let best = "Mumbai", bestDist = Infinity;
  for (const [city, [clat, clng]] of Object.entries(MODEL_CITIES)) {
    const d = Math.hypot(lat - clat, lng - clng);
    if (d < bestDist) { bestDist = d; best = city; }
  }
  return best;
}

/**
 * Fetch a road-following route from OSRM.
 * Returns an array of [lat, lng] points tracing actual roads.
 */
async function fetchRoadRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  try {
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return [];
    return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
  } catch {
    return [];
  }
}

/**
 * Fetch MULTIPLE alternative routes from OSRM between origin and destination.
 * Returns an array of routes, each being an array of [lat, lng] points.
 * All routes follow real roads — OSRM computes them.
 */
async function fetchAlternativeRoutes(
  origin: [number, number],
  destination: [number, number],
): Promise<[number, number][][]> {
  try {
    const coords = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=3`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return [];
    return data.routes.map((route: any) =>
      route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
    );
  } catch {
    return [];
  }
}

function getNearestZone(lat: number, lng: number) {
  let nearest = riskZones[0];
  let minDist = Infinity;
  for (const zone of riskZones) {
    const d = getDistanceFromLatLonInKm(lat, lng, zone.lat, zone.lng);
    if (d < minDist) {
      minDist = d;
      nearest = zone;
    }
  }
  return { zone: nearest, distanceKm: Math.round(minDist) };
}

/**
 * Check if any point on the path enters the danger zone.
 */
function routeIntersectsDanger(
  path: [number, number][],
  danger: [number, number],
  dangerRadiusM: number,
): boolean {
  return path.some(([lat, lng], idx) => {
    if (idx < 1) return false;
    const dMeters = getDistanceFromLatLonInKm(lat, lng, danger[0], danger[1]) * 1000;
    return dMeters <= dangerRadiusM;
  });
}

/**
 * Given a road-route polyline, pick the point at fractional distance `frac`
 * along its total length. This ensures the disruption sits on an actual road.
 */
function pickPointOnRoute(
  route: [number, number][],
  frac: number,
): [number, number] {
  if (route.length < 2) return route[0];

  const dists: number[] = [0];
  for (let i = 1; i < route.length; i++) {
    dists.push(
      dists[i - 1] +
        getDistanceFromLatLonInKm(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1]),
    );
  }
  const totalKm = dists[dists.length - 1];
  const targetKm = totalKm * frac;

  for (let i = 1; i < route.length; i++) {
    if (dists[i] >= targetKm) {
      const segLen = dists[i] - dists[i - 1];
      const t = segLen > 0 ? (targetKm - dists[i - 1]) / segLen : 0;
      return [
        route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t,
        route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t,
      ];
    }
  }
  return route[route.length - 1];
}

/**
 * Compute the local bearing of a route at a given point index, in radians.
 */
function routeBearingAt(route: [number, number][], idx: number): number {
  const i = Math.min(Math.max(idx, 0), route.length - 2);
  const latScale = 111320;
  const avgLat = ((route[i][0] + route[i + 1][0]) / 2) * (Math.PI / 180);
  const lngScale = 111320 * Math.cos(avgLat);
  const dy = (route[i + 1][0] - route[i][0]) * latScale;
  const dx = (route[i + 1][1] - route[i][1]) * lngScale;
  return Math.atan2(dx, dy);
}

/**
 * Project a point from `center` along a bearing by `distanceM` meters.
 */
function projectAtBearing(
  center: [number, number],
  bearingRad: number,
  distanceM: number,
): [number, number] {
  const latScale = 111320;
  const avgLatRad = center[0] * (Math.PI / 180);
  const lngScale = Math.max(25000, 111320 * Math.cos(avgLatRad));
  return [
    center[0] + (Math.cos(bearingRad) * distanceM) / latScale,
    center[1] + (Math.sin(bearingRad) * distanceM) / lngScale,
  ];
}

const BIKE_ICON_HTML = `
  <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;
    background:#009AFD;border-radius:50%;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,154,253,0.5);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>
      <path d="M9 17h6M14 17V9l-3-3H9m5 0h3l2 4"/>
    </svg>
  </div>`;

export function LiveMapPage() {
  const { t } = useTranslation("livemap");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const riderMark = useRef<L.Marker | null>(null);
  const accuracyCircle = useRef<L.Circle | null>(null);
  const watchId = useRef<number | null>(null);
  const hasFlown = useRef(false);
  const simDriverMark = useRef<L.Marker | null>(null);
  const simOrigPath = useRef<L.Polyline | null>(null);
  const simReroutePath = useRef<L.Polyline | null>(null);
  const simDangerZone = useRef<L.Circle | null>(null);
  const simAnimFrame = useRef<ReturnType<typeof setInterval> | null>(null);
  const simExtraMarkers = useRef<L.Layer[]>([]);

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "tracking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [nearestZone, setNearest] = useState<{ zone: typeof riskZones[0]; distanceKm: number } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [simMode, setSimMode] = useState<"off" | "active">("off");
  const [simStep, setSimStep] = useState(0);
  const [simTotal, setSimTotal] = useState(0);
  const [predictedRisk, setPredictedRisk] = useState<{ score: number; leadMin: number } | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => { loadDisruptionModel(); }, []);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 5, scrollWheelZoom: true, zoomControl: true });
    mapInst.current = map;

    tileLayerRef.current = L.tileLayer(OSM_TILES, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    riskZones.forEach((zone) => {
      const cfg = riskConfig[zone.risk as keyof typeof riskConfig];
      L.circle([zone.lat, zone.lng], {
        color: cfg.color,
        fillColor: cfg.fillColor,
        fillOpacity: 0.55,
        weight: 2.5,
        radius: cfg.radius,
      })
        .addTo(map)
        .bindPopup(`<b>${zone.area}</b><br/>${zone.reason}`);
    });

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setStatus("idle");
  };

  const clearSimulation = () => {
    if (simAnimFrame.current) clearInterval(simAnimFrame.current);
    simAnimFrame.current = null;
    simDriverMark.current?.remove(); simDriverMark.current = null;
    simOrigPath.current?.remove(); simOrigPath.current = null;
    simReroutePath.current?.remove(); simReroutePath.current = null;
    simDangerZone.current?.remove(); simDangerZone.current = null;
    simExtraMarkers.current.forEach((m) => m.remove());
    simExtraMarkers.current = [];
    setSimStep(0);
    setSimTotal(0);
    setSimMode("off");
    setPredictedRisk(null);
  };

  const simulateDisruption = async () => {
    const map = mapInst.current;
    if (!map) return;

    // Anchor on live GPS; fall back to cached coords; else use Mumbai default
    const cached = localStorage.getItem("insuregig_gps_coords");
    const cachedObj = cached ? JSON.parse(cached) : null;
    const origin: [number, number] = coords
      ? [coords.lat, coords.lng]
      : cachedObj
      ? [cachedObj.lat, cachedObj.lon]
      : [19.0760, 72.8777];

    // Synthetic destination ~4 km NE of origin (a realistic delivery hop)
    const destination: [number, number] = [origin[0] + 0.032, origin[1] + 0.028];

    // ── Step 1: Fetch ALL OSRM routes (primary + alternatives) ────────────
    // Using alternatives=3 gives us multiple real-road routes between origin
    // and destination. Every route returned by OSRM follows actual roads.
    const allRoutes = await fetchAlternativeRoutes(origin, destination);
    if (allRoutes.length === 0 || allRoutes[0].length < 2) {
      toast.error("Could not fetch road route from OSRM. Check your internet connection.");
      return;
    }

    // The first route is the primary/shortest (direct) route
    const directRoad = allRoutes[0];

    // ── Step 2: ML prediction 30 min ahead ──────────────────────────────────
    const futureWindow = new Date(Date.now() + 30 * 60 * 1000);
    const cityName = nearestModelCity(origin[0], origin[1]);
    const forecast = await predictDisruption(cityName, futureWindow, 180, 45);
    setPredictedRisk({ score: forecast.overallRisk, leadMin: 30 });

    // ── Step 3: Place disruption ON the actual road route ────────────────────
    // Pick a point ~40% along the real road route, so the direct path
    // genuinely passes through the disruption zone.
    const danger = pickPointOnRoute(directRoad, 0.4);
    const dangerRadiusM = 1200; // realistic disruption radius

    // Always reroute in the simulation (showcase ML-driven rerouting)
    const shouldReroute = forecast.overallRisk >= 15;

    // ── Step 4: Find safe route from OSRM alternatives ──────────────────────
    let safeRoad: [number, number][] = [];
    if (shouldReroute) {
      // First: check if any OSRM alternative route naturally avoids the danger zone.
      // These are real-road routes computed by OSRM, so they follow actual roads perfectly.
      for (let i = 1; i < allRoutes.length; i++) {
        if (allRoutes[i].length > 2 && !routeIntersectsDanger(allRoutes[i], danger, dangerRadiusM)) {
          safeRoad = allRoutes[i];
          break;
        }
      }

      // Fallback: if no OSRM alternative avoids, use a waypoint-based detour.
      // Compute a perpendicular offset from the danger point and ask OSRM to
      // route through it — this still gives a real-road route.
      if (safeRoad.length === 0) {
        let closestIdx = 0;
        let closestDist = Infinity;
        for (let i = 0; i < directRoad.length - 1; i++) {
          const d = getDistanceFromLatLonInKm(
            directRoad[i][0], directRoad[i][1], danger[0], danger[1],
          );
          if (d < closestDist) { closestDist = d; closestIdx = i; }
        }
        const bearing = routeBearingAt(directRoad, closestIdx);
        const perpBearing = bearing + Math.PI / 2;

        const clearanceLevels = [
          dangerRadiusM + 1500,
          dangerRadiusM + 3000,
          dangerRadiusM + 5000,
        ];

        for (const clearance of clearanceLevels) {
          // Try one side
          const wp = projectAtBearing(danger, perpBearing, clearance);
          const candidate = await fetchRoadRoute([origin, wp, destination]);
          if (candidate.length > 2 && !routeIntersectsDanger(candidate, danger, dangerRadiusM)) {
            safeRoad = candidate;
            break;
          }
          // Try the other side
          const wpOther = projectAtBearing(danger, perpBearing + Math.PI, clearance);
          const candidateOther = await fetchRoadRoute([origin, wpOther, destination]);
          if (candidateOther.length > 2 && !routeIntersectsDanger(candidateOther, danger, dangerRadiusM)) {
            safeRoad = candidateOther;
            break;
          }
        }
      }
    }

    // Determine which path the driver follows
    const activePath = shouldReroute && safeRoad.length > 2
      ? safeRoad
      : directRoad;

    // ── Step 5: Draw everything on the map ───────────────────────────────────
    clearSimulation();
    setSimMode("active");
    setSimTotal(activePath.length);

    // Predicted disruption zone (what the model flagged 30 min ahead)
    simDangerZone.current = L.circle(danger, {
      radius: dangerRadiusM,
      color: "#dc2626",
      fillColor: "#fecaca",
      fillOpacity: 0.35,
      weight: 2.5,
      dashArray: "6 4",
    })
      .addTo(map)
      .bindPopup(
        `<b>⚠ Predicted disruption (T+30 min)</b><br/>` +
          `Risk score: ${forecast.overallRisk}/100<br/>` +
          `Weather ${Math.round(forecast.weather * 100)}% · AQI ${Math.round(forecast.aqi * 100)}% · ` +
          `Traffic ${Math.round(forecast.traffic * 100)}%<br/>` +
          `Source: ${forecast.source}`,
      );

    // Direct (unsafe) path — shown as dashed red when rerouting
    simOrigPath.current = L.polyline(directRoad, {
      color: shouldReroute ? "#ef4444" : "#009AFD",
      weight: shouldReroute ? 4 : 4,
      dashArray: shouldReroute ? "10 8" : undefined,
      opacity: shouldReroute ? 0.75 : 0.9,
    })
      .addTo(map)
      .bindPopup(shouldReroute ? "<b>❌ Original direct route</b><br/>Crosses predicted disruption zone" : "<b>Active route</b>");

    // Reroute (green) only shown when rerouting is triggered
    if (shouldReroute && safeRoad.length > 2) {
      simReroutePath.current = L.polyline(safeRoad, {
        color: "#22c55e", weight: 5, opacity: 0.95,
      })
        .addTo(map)
        .bindPopup("<b>✅ AI-rerouted safe path</b><br/>Avoiding predicted disruption zone");
    }

    // Destination marker
    const destMarker = L.marker(destination, { zIndexOffset: 1500 })
      .addTo(map)
      .bindPopup("<b>Destination</b>");
    simExtraMarkers.current.push(destMarker);

    // Origin marker
    const origIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const origMarker = L.marker(origin, { icon: origIcon, zIndexOffset: 1500 })
      .addTo(map)
      .bindPopup("<b>Start</b>");
    simExtraMarkers.current.push(origMarker);

    // Bike icon for the driver
    const bikeIcon = L.divIcon({ className: "", html: BIKE_ICON_HTML, iconSize: [36, 36], iconAnchor: [18, 18] });
    simDriverMark.current = L.marker(activePath[0], { icon: bikeIcon, zIndexOffset: 2000 })
      .addTo(map)
      .bindPopup("<b>Driver in transit</b>");

    const bounds = L.latLngBounds([origin, destination, danger]);
    map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });

    toast[shouldReroute ? "warning" : "success"](
      shouldReroute
        ? `ML forecast: ${forecast.overallRisk}/100 risk in 30 min — rerouting driver around disruption`
        : `ML forecast: ${forecast.overallRisk}/100 — route is clear`,
    );

    // ── Step 6: Animate the driver along the active path ─────────────────────
    let step = 0;
    simAnimFrame.current = setInterval(() => {
      step++;
      if (step >= activePath.length) {
        clearInterval(simAnimFrame.current!);
        simAnimFrame.current = null;
        toast.success("Driver reached destination safely — disruption zone avoided");
        return;
      }
      simDriverMark.current?.setLatLng(activePath[step]);
      setSimStep(step);
    }, 400);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setErrorMsg(t("locationFailed"));
      setStatus("error");
      return;
    }

    setStatus("tracking");
    setErrorMsg("");
    hasFlown.current = false;

    const riderIcon = L.divIcon({
      className: "",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#1a1a1a;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0">
          <circle cx="12" cy="7" r="4"/><path d="M12 14c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setCoords({ lat, lng, accuracy });
        setPingCount((c) => c + 1);
        setNearest(getNearestZone(lat, lng));
        localStorage.setItem("insuregig_gps_coords", JSON.stringify({ lat, lon: lng, accuracy, ts: Date.now() }));

        const map = mapInst.current;
        if (!map) return;

        if (riderMark.current) {
          riderMark.current.setLatLng([lat, lng]);
        } else {
          riderMark.current = L.marker([lat, lng], { icon: riderIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(`<b>${t("yourLiveLocation")}</b><br/>${t("accuracyMeters", { meters: Math.round(accuracy) })}`);
        }

        if (accuracyCircle.current) {
          accuracyCircle.current.setLatLng([lat, lng]).setRadius(accuracy);
        } else {
          accuracyCircle.current = L.circle([lat, lng], {
            radius: accuracy,
            color: "#009AFD",
            fillColor: "#93c5fd",
            fillOpacity: 0.2,
            weight: 1,
          }).addTo(map);
        }

        if (!hasFlown.current) {
          map.flyTo([lat, lng], 14, { duration: 1.5 });
          hasFlown.current = true;
        }
      },
      (err) => {
        setStatus("error");
        setErrorMsg(
          err.code === 1 ? t("permissionDenied") : err.code === 2 ? t("positionUnavailable") : t("timeout"),
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const recenter = () => {
    if (coords && mapInst.current) {
      mapInst.current.flyTo([coords.lat, coords.lng], 15, { duration: 1 });
    }
  };

  const toggleSatellite = () => {
    const map = mapInst.current;
    if (!map || !tileLayerRef.current) return;
    tileLayerRef.current.remove();
    const next = !isSatellite;
    tileLayerRef.current = L.tileLayer(next ? SAT_TILES : OSM_TILES, {
      attribution: next
        ? "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP"
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    setIsSatellite(next);
  };

  useEffect(() => () => { stopTracking(); clearSimulation(); }, []);

  const nearRisk = nearestZone?.zone.risk as keyof typeof riskConfig | undefined;
  const riskBadgeColor = nearRisk === "high" ? "bg-red-100 text-red-700 border-red-200" : nearRisk === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-green-100 text-green-700 border-green-200";

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-7 h-7 text-brand-500" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {simMode === "off" ? (
            <Button variant="outline" onClick={simulateDisruption} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Zap className="w-4 h-4 mr-1" /> Simulate Disruption
            </Button>
          ) : (
            <Button variant="outline" onClick={clearSimulation} className="border-gray-300 text-gray-600">
              Waypoint {Math.min(simStep + 1, simTotal)}/{simTotal} — Stop
            </Button>
          )}
          <Button variant="outline" onClick={toggleSatellite} className={`border-slate-300 ${isSatellite ? "bg-slate-800 text-white hover:bg-slate-700" : "text-slate-700 hover:bg-slate-50"}`}>
            <Satellite className="w-4 h-4 mr-1" /> {isSatellite ? "Street" : "Satellite"}
          </Button>
          {status === "tracking" && (
            <Button variant="outline" onClick={recenter} className="border-brand-200 text-brand-700 hover:bg-brand-50">
              <Crosshair className="w-4 h-4 mr-1" /> {t("recenter")}
            </Button>
          )}
          {status !== "tracking" ? (
            <Button onClick={startTracking} className="bg-brand-500 hover:bg-brand-600 shadow-md">
              <MapPin className="w-4 h-4 mr-2" /> {t("startTracking")}
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="shadow-md">
              <WifiOff className="w-4 h-4 mr-2" /> {t("stopTracking")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {simMode === "active" && predictedRisk && (
          <Badge className={`px-3 py-1.5 text-sm font-medium border ${predictedRisk.score >= 55 ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
            <Bike className="w-3.5 h-3.5 mr-1 inline" />
            ML forecast T+{predictedRisk.leadMin}min · risk {predictedRisk.score}/100
            {predictedRisk.score >= 55 ? " · rerouting" : " · route clear"}
          </Badge>
        )}
        <Badge className={`px-3 py-1.5 text-sm font-medium ${status === "tracking" ? "bg-green-100 text-green-700 border border-green-200" : status === "error" ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          {status === "tracking" ? <><Wifi className="w-3.5 h-3.5 mr-1 inline" /> {t("gpsPings", { count: pingCount })}</> : status === "error" ? <><AlertTriangle className="w-3.5 h-3.5 mr-1 inline" /> {t("error")}</> : t("trackingOff")}
        </Badge>
        {coords && (
          <>
            <Badge className="bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 text-sm font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Badge>
            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 text-sm">±{Math.round(coords.accuracy)}m {t("accuracy")}</Badge>
          </>
        )}
        {nearestZone && nearRisk && (
          <Badge className={`px-3 py-1.5 text-sm border ${riskBadgeColor}`}>
            <Shield className="w-3.5 h-3.5 mr-1 inline" />
            {t(riskConfig[nearRisk].label)} - {t("zoneAway", { distance: nearestZone.distanceKm, area: nearestZone.zone.area })}
          </Badge>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{t("locationFailed")}</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-gray-200 shadow-md">
        <CardHeader className="py-2 px-4 bg-white border-b">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-500" /> {t("liveMap")}
            {status === "tracking" && <RefreshCw className="w-3 h-3 ml-1 text-brand-400 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapRef} style={{ height: "480px", width: "100%" }} />
        </CardContent>
      </Card>

      {status === "idle" && (
        <div className="text-center py-8 text-gray-500">
          <Navigation className="w-12 h-12 mx-auto mb-3 text-brand-200" />
          <p className="font-medium text-gray-700">{t("startTrackingPrompt")}</p>
          <p className="text-sm mt-1">{t("browserPermission")}</p>
        </div>
      )}

      <Card className="border-gray-100">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">{t("riskZoneLegend")}</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(riskConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: cfg.fillColor, borderColor: cfg.color }} />
                <span className="text-sm text-gray-700 font-medium">{t(cfg.label)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
