import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { CheckCircle, Cloud, TrendingUp, Wallet, ShieldCheck, Activity, Settings2, History, RefreshCw, Smartphone, Car, Wind, AlertTriangle, MapPin, MessageSquare, X } from "lucide-react";
import { Slider } from "../components/ui/slider";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { mockApi } from "../../services/mockApi";
import { fetchLiveWeather } from "../../services/weatherApi";
import { loadPremiumModel, isPremiumModelReady } from "../../services/mlEngine";
import { sendPayoutSms } from "../../services/smsApi";
import {
  clearStoredClaimData,
  getDisruptionDescription,
  getDisruptionSource,
  getStoredClaimHistory,
  getStoredDisruptionHistory,
  saveStoredClaimHistory,
  saveStoredDisruptionHistory,
} from "../../services/policyData";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const spoofLocations = {
  "Delhi": { lat: 28.7041, lon: 77.1025, name: "New Delhi, India" },
  "Bangalore": { lat: 12.9716, lon: 77.5946, name: "Bangalore, India" },
  "London": { lat: 51.5074, lon: -0.1278, name: "London, UK" },
  "New_York": { lat: 40.7128, lon: -74.0060, name: "New York, USA" }
};

// Google Pay color tokens
const GP = {
  blue: "#009AFD",
  green: "#34A853",
  red: "#EA4335",
  yellow: "#FBBC04",
  dark: "#202124",
  mid: "#5F6368",
  light: "#F8F9FA",
  border: "#E8EAED",
};

export function ClaimsPage() {
  const { t } = useTranslation("claims");
  const [demoState, setDemoState] = useState<"idle" | "simulating" | "fraud_check" | "fraud_failed" | "calculating" | "done">("idle");

  const [user, setUser] = useState<any>({ name: "Rider", dailyIncome: 600, premiumPaid: 35, location: "Mumbai", platform: "Swiggy" });

  const [disruptionType, setDisruptionType] = useState("weather");
  const [severity, setSeverity] = useState([80]);
  const [demandLevel, setDemandLevel] = useState([4]);

  const [simulateFraud, setSimulateFraud] = useState(false);
  const [spoofedCity, setSpoofedCity] = useState("New_York");
  const [premiumModelReady, setPremiumModelReady] = useState(false);

  const [fraudResult, setFraudResult] = useState<any>(null);
  const [claimResult, setClaimResult] = useState<any>(null);
  const [claimHistory, setClaimHistory] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [smsPreview, setSmsPreview] = useState<{ phone: string; message: string; ref: string } | null>(null);

  const TRIGGER_THRESHOLDS: Record<string, number> = { weather: 70, aqi: 65, traffic: 75, platform_outage: 55 };
  const prevTriggerFiredRef = useRef(false);

  const maskPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 2) return "\u2022\u2022";
    return `${"\u2022".repeat(Math.max(0, digits.length - 2))}${digits.slice(-2)}`;
  };

  const clearHistory = () => {
    clearStoredClaimData();
    setClaimHistory([]);
    toast.success(t("walletResetSuccess"));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setClaimHistory(getStoredClaimHistory());
    loadPremiumModel().finally(() => setPremiumModelReady(isPremiumModelReady()));
  }, []);

  const handleFetchLiveWeather = async () => {
    if (!user?.location) return toast.error(t("forLocation") + " " + t("error"));
    setIsFetchingWeather(true);
    toast.info(`${t("liveApi")} - ${user.location}`);
    try {
      const data = await fetchLiveWeather(user.location);
      if (data.success) {
        setSeverity([data.severity]);
        const autoDemand = Math.max(5, Math.round(100 - (data.severity * 1.2)));
        setDemandLevel([autoDemand]);
        toast.success(`${t("liveWeather")}: ${data.description} (${data.temp}°C). ${t("severityScore")}: ${data.severity}%.`);
      } else {
        toast.error(t("liveApi") + ": " + (data.error || ""));
      }
    } catch (e) {
      toast.error(t("error"));
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const buildFlowInput = () => {
    const savedGps = localStorage.getItem('insuregig_gps_coords');
    const realGps = savedGps ? JSON.parse(savedGps) : null;
    const isRealGps = realGps && (Date.now() - realGps.ts < 5 * 60 * 1000);
    const trueGps = isRealGps ? { lat: realGps.lat, lon: realGps.lon } : { lat: 19.0770, lon: 72.8780 };
    const ipCoords = { lat: trueGps.lat + 0.018, lon: trueGps.lon + 0.018 };
    const spoofCoords = simulateFraud ? spoofLocations[spoofedCity as keyof typeof spoofLocations] : trueGps;
    const movementPath = simulateFraud
      ? [
          { lat: trueGps.lat, lon: trueGps.lon },
          { lat: trueGps.lat + 0.0001, lon: trueGps.lon + 0.0001 },
          { lat: trueGps.lat + 0.0002, lon: trueGps.lon + 0.0001 },
          { lat: spoofCoords.lat, lon: spoofCoords.lon },
        ]
      : [
          { lat: trueGps.lat, lon: trueGps.lon },
          { lat: trueGps.lat + 0.0002, lon: trueGps.lon + 0.0001 },
          { lat: trueGps.lat + 0.0004, lon: trueGps.lon + 0.0002 },
          { lat: trueGps.lat + 0.0005, lon: trueGps.lon + 0.0001 },
        ];
    return {
      spoofCoords,
      payload: {
        worker: {
          dailyIncome: user.dailyIncome || 500,
          premiumPaid: user.premiumPaid || 35,
          platform: user.platform || "App",
          policyActive: true,
        },
        event: { disruptionType, severity: severity[0] / 100, demandLevel: demandLevel[0] / 100 },
        gpsCoords: spoofCoords,
        ipCoords,
        telemetry: {
          platformLoginCoords: ipCoords,
          previousCoords: { lat: trueGps.lat, lon: trueGps.lon },
          movementPath,
          minutesSinceLastPing: 10,
          gpsAccuracyMeters: simulateFraud ? 2 : 25,
          claimHistoryCount: claimHistory.length,
          weatherSeverityAtGps: simulateFraud ? Math.min(100, severity[0]) : Math.max(0, severity[0] - 5),
          weatherSeverityAtIp: simulateFraud ? Math.max(0, severity[0] - 55) : Math.max(0, severity[0] - 8),
          currentDisruptionSeverity: severity[0],
        },
      },
    };
  };

  const executeParametricFlow = async (options?: { persist?: boolean; sendSms?: boolean; silent?: boolean }) => {
    const persist = options?.persist ?? false;
    const shouldSendSms = options?.sendSms ?? false;
    const silent = options?.silent ?? false;

    setDemoState("simulating");
    const { spoofCoords, payload } = buildFlowInput();
    const flow = await mockApi.runParametricClaimFlow(payload);

    if (!flow.approved && flow.stage !== "fraud_failed") {
      setClaimResult(null);
      setFraudResult(null);
      setDemoState("idle");
      if (!silent) toast.error(flow.reason || t("monitoring"));
      return;
    }

    if (flow.stage === "fraud_failed") {
      setClaimResult(null);
      setFraudResult({ ...(flow.fraud || {}), spoofedDetails: spoofCoords });
      setDemoState("fraud_failed");
      if (!silent) toast.error(t("claimRejected"));
      return;
    }

    if (!flow.claim) {
      setDemoState("idle");
      if (!silent) toast.error(t("error"));
      return;
    }

    setFraudResult({ ...(flow.fraud || {}), spoofedDetails: spoofCoords });
    setClaimResult(flow.claim);
    setDemoState("done");

    if (persist) {
      setClaimHistory((prev) => {
        const timestamp = new Date().toISOString();
        const recordId = `CLM-${Date.now()}`;
        const newRecord = {
          ...flow.claim,
          id: recordId,
          date: timestamp,
          payout: Number(flow.claim.payout || 0),
          hoursLost: Number(flow.claim.hoursLost || 0),
          expectedIncomeWithoutDisruption: Number(flow.claim.expectedIncomeWithoutDisruption || 0),
          actualIncomeWithDisruption: Number(flow.claim.actualIncomeWithDisruption || 0),
          expectedLoss: Number(flow.claim.expectedLoss || 0),
        };
        const newHistory = [...prev, newRecord];
        saveStoredClaimHistory(newHistory);

        const disruptionHistory = getStoredDisruptionHistory();
        const disruptionRecord = {
          id: recordId,
          date: timestamp,
          disruptionType,
          severity: severity[0],
          demandLevel: demandLevel[0],
          payout: Number(flow.claim.payout || 0),
          hoursLost: Number(flow.claim.hoursLost || 0),
          status: "Completed" as const,
          source: getDisruptionSource(disruptionType),
          description: getDisruptionDescription(disruptionType, severity[0], demandLevel[0]),
        };
        saveStoredDisruptionHistory([...disruptionHistory, disruptionRecord]);
        return newHistory;
      });
    }

    if (shouldSendSms) {
      const phone = String(user?.phone || "").trim();
      const maskedPhone = phone ? maskPhoneNumber(phone) : "";
      const ref = `INVG-${Date.now().toString().slice(-6)}`;
      const smsMessage = `InsureGig Alert: Parametric payout of Rs.${flow.claim.payout} has been released for ${flow.claim.disruptionType}. Ref: ${ref}.`;
      const sendingToast = toast.loading(phone ? `Sending SMS alert to ${maskedPhone}...` : "Sending SMS alert...");
      if (phone) {
        const smsResult = await sendPayoutSms(phone, smsMessage);
        toast.dismiss(sendingToast);
        if (smsResult.ok) {
          toast.success(`${t("smsInsureGig")} ${t("delivered")} ${t("smsTo")} ${maskedPhone}`);
        } else {
          setSmsPreview({ phone: maskedPhone, message: smsMessage, ref });
        }
      } else {
        toast.dismiss(sendingToast);
        setSmsPreview({ phone: "rider's registered number", message: smsMessage, ref });
      }
    }
  };

  const runDemo = () => executeParametricFlow({ persist: true, sendSms: true, silent: false });

  useEffect(() => {
    const threshold = TRIGGER_THRESHOLDS[disruptionType] ?? 70;
    const triggerFires = severity[0] >= threshold;
    const justCrossed = triggerFires && !prevTriggerFiredRef.current;
    prevTriggerFiredRef.current = triggerFires;
    const timer = setTimeout(() => {
      executeParametricFlow({ persist: justCrossed, sendSms: justCrossed, silent: !justCrossed });
    }, 600);
    return () => clearTimeout(timer);
  }, [disruptionType, severity, demandLevel, simulateFraud, spoofedCity, user]);

  const getDisruptionIcon = (type: string, className = "w-5 h-5") => {
    switch (type) {
      case "weather": return <Cloud className={className} />;
      case "platform_outage": return <Smartphone className={className} />;
      case "traffic": return <Car className={className} />;
      case "aqi": return <Wind className={className} />;
      default: return <Cloud className={className} />;
    }
  };

  const getDisruptionName = (type: string) => {
    switch (type) {
      case "weather": return "Weather API";
      case "platform_outage": return "Platform Status API";
      case "traffic": return "Traffic Maps API";
      case "aqi": return "AQI Sensor API";
      default: return "Disruption API";
    }
  };

  return (
    <div className="w-full min-h-full bg-white px-4 py-6 md:min-h-screen md:px-6 lg:px-8 space-y-5">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: GP.dark }}>{t("title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: GP.mid }}>{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{ borderColor: GP.border, color: GP.mid, background: showAdmin ? GP.light : "white" }}
          >
            <Settings2 className="w-4 h-4" /> {t("controlPanel")}
          </button>
          {demoState === "idle" && (
            <button
              onClick={runDemo}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: GP.blue }}
            >
              <Activity className="w-4 h-4" /> {t("releasePayout")}
            </button>
          )}
          {(demoState === "done" || demoState === "fraud_failed") && (
            <button
              onClick={() => { setDemoState("idle"); setClaimResult(null); setFraudResult(null); prevTriggerFiredRef.current = false; }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-colors"
              style={{ borderColor: GP.blue, color: GP.blue }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ GPS Spoof Detector card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border p-5" style={{ borderColor: GP.border, background: GP.light }}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#E8F0FE" }}>
            <ShieldCheck className="w-4 h-4" style={{ color: GP.blue }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: GP.dark }}>{t("gpsSpoofDetector")}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: premiumModelReady ? "#E6F4EA" : "#F1F3F4", color: premiumModelReady ? GP.green : GP.mid }}
          >
            {premiumModelReady ? t("modelActive") : t("loadingModel")}
          </span>
          {(() => {
            const saved = localStorage.getItem('insuregig_gps_coords');
            const gps = saved ? JSON.parse(saved) : null;
            const fresh = gps && (Date.now() - gps.ts < 5 * 60 * 1000);
            return fresh ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "#E6F4EA", color: GP.green }}>
                <MapPin className="w-3 h-3" /> {t("liveGps")}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "#F1F3F4", color: GP.mid }}>
                <MapPin className="w-3 h-3" /> {t("noLiveGps")}
              </span>
            );
          })()}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: GP.mid }}>
          {t("activeChecks")}
        </p>
        {fraudResult && (
          <div className="mt-3 rounded-xl border p-3 bg-white text-xs" style={{ borderColor: GP.border }}>
            <span className="font-semibold" style={{ color: GP.dark }}>
              {t("latest")}: {fraudResult.isValid ? t("latestPass") : t("latestBlocked")} · {t("riskScore")} {fraudResult.riskScore ?? 0}
            </span>
            <span className="ml-3" style={{ color: GP.mid }}>
              GPS/IP {fraudResult?.checks?.gpsVsIpKm ?? 0} km
              {fraudResult?.checks?.pathLinearity != null ? ` Â· Linearity ${fraudResult.checks.pathLinearity}` : ""}
              {fraudResult?.checks?.weatherSeverityGap != null ? ` Â· Weather gap ${fraudResult.checks.weatherSeverityGap}` : ""}
            </span>
          </div>
        )}
        {!fraudResult && (
          <p className="mt-2 text-xs" style={{ color: GP.mid }}>{t("autoMonitoring")}</p>
        )}
      </div>

      {/* â”€â”€ Control Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showAdmin && (
        <div className="rounded-2xl border p-5 space-y-6 animate-in fade-in slide-in-from-top-4" style={{ borderColor: GP.border }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm" style={{ color: GP.dark }}>Control Panel</span>
            <button
              onClick={() => setSimulateFraud(!simulateFraud)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={simulateFraud
                ? { background: "#FDECEA", color: GP.red, borderColor: "#F5C6C2" }
                : { background: "white", color: GP.mid, borderColor: GP.border }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {simulateFraud ? t("fraudSimOn") : t("testAntiFraud")}
            </button>
          </div>

          {simulateFraud && (
            <div className="rounded-xl border p-4" style={{ borderColor: "#F5C6C2", background: "#FDECEA" }}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" style={{ color: GP.red }} />
                <span className="text-sm font-semibold" style={{ color: GP.red }}>{t("spoofedGpsTarget")}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 items-start">
                <Select value={spoofedCity} onValueChange={setSpoofedCity}>
                  <SelectTrigger className="h-10 rounded-xl text-sm" style={{ borderColor: "#F5C6C2", background: "white" }}>
                    <SelectValue placeholder={t("selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delhi">Delhi, India (1,148 km)</SelectItem>
                    <SelectItem value="Bangalore">Bangalore, India (845 km)</SelectItem>
                    <SelectItem value="London">London, UK (7,190 km)</SelectItem>
                    <SelectItem value="New_York">New York, USA (12,530 km)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed" style={{ color: GP.red }}>
                  {t("gpsTransmitFrom")} <strong>{spoofLocations[spoofedCity as keyof typeof spoofLocations].name}</strong> {t("whileIpTraces")}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: GP.mid }}>{t("disruptionType")}</Label>
              <Select value={disruptionType} onValueChange={setDisruptionType}>
                <SelectTrigger className="h-10 rounded-xl text-sm" style={{ borderColor: GP.border }}>
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weather">{t("extremeWeather")}</SelectItem>
                  <SelectItem value="platform_outage">{t("deliveryOutage")}</SelectItem>
                  <SelectItem value="traffic">{t("trafficGridlock")}</SelectItem>
                  <SelectItem value="aqi">{t("hazardousAqi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: GP.mid }}>{t("severityScore")}</Label>
                <div className="flex items-center gap-2">
                  {disruptionType === "weather" && (
                    <button
                      onClick={handleFetchLiveWeather}
                      disabled={isFetchingWeather}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border disabled:opacity-50"
                      style={{ borderColor: GP.border, color: GP.blue }}
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingWeather ? "animate-spin" : ""}`} />
                      Live API
                    </button>
                  )}
                  <span className="text-sm font-bold tabular-nums" style={{ color: GP.blue }}>{severity[0]}%</span>
                </div>
              </div>
              <Slider value={severity} onValueChange={setSeverity} max={100} step={1} className="py-4 cursor-pointer" />
            </div>

            <div className="md:col-span-2 space-y-3 pt-4" style={{ borderTop: `1px solid ${GP.border}` }}>
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: GP.mid }}>{t("deliveryDemandLeft")}</Label>
                <span className="text-sm font-bold tabular-nums" style={{ color: GP.blue }}>{demandLevel[0]}%</span>
              </div>
              <Slider value={demandLevel} onValueChange={setDemandLevel} max={100} step={1} className="py-4 cursor-pointer" />
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {demoState !== "idle" && demoState !== "done" && demoState !== "fraud_failed" && (
        <div className="rounded-2xl border p-5 flex items-center gap-4 animate-pulse" style={{ borderColor: GP.border, background: GP.light }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F0FE" }}>
            {demoState === "simulating" && getDisruptionIcon(disruptionType, "w-5 h-5 animate-bounce")}
            {demoState === "fraud_check" && <ShieldCheck className="w-5 h-5 animate-spin" style={{ color: GP.blue }} />}
            {demoState === "calculating" && <TrendingUp className="w-5 h-5 animate-bounce" style={{ color: GP.green }} />}
          </div>
          <div>
            {demoState === "simulating" && (
              <p className="text-sm font-medium" style={{ color: GP.dark }}>Monitoring {disruptionType} + demand for {user.location}â€¦</p>
            )}
            {demoState === "fraud_check" && (
              <p className="text-sm font-medium" style={{ color: GP.dark }}>Verifying GPS vs IP and platform-loginâ€¦</p>
            )}
            {demoState === "calculating" && (
              <p className="text-sm font-medium" style={{ color: GP.dark }}>{fraudResult?.distance}km variance confirmed. Calculating payoutâ€¦</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: GP.mid }}>This usually takes a moment</p>
          </div>
        </div>
      )}

      {/* â”€â”€ Fraud blocked â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {demoState === "fraud_failed" && fraudResult && (
        <div className="rounded-2xl border p-5 space-y-4 animate-in zoom-in-95 duration-300" style={{ borderColor: "#F5C6C2", background: "#FDECEA" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FCDBD9" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: GP.red }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: GP.dark }}>{t("claimRejected")}</p>
              <p className="text-xs mt-0.5" style={{ color: GP.mid }}>Anti-spoofing engine flagged high risk across location and verification signals</p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 relative overflow-hidden" style={{ border: `1px solid ${GP.border}` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
              <ShieldCheck className="w-48 h-48" style={{ color: GP.red }} />
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-xs uppercase tracking-wide font-medium" style={{ color: GP.mid }}>GPS Location</p>
                <p className="font-semibold text-sm mt-1" style={{ color: GP.dark }}>
                  {fraudResult.spoofedDetails.name}{" "}
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#FDECEA", color: GP.red }}>Spoofed</span>
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: GP.mid }}>
                  {fraudResult.spoofedDetails.lat.toFixed(4)}, {fraudResult.spoofedDetails.lon.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-medium" style={{ color: GP.mid }}>Network IP Origin</p>
                <p className="font-semibold text-sm mt-1" style={{ color: GP.dark }}>Chennai, India</p>
                <p className="text-xs mt-1 font-mono" style={{ color: GP.mid }}>19.0760, 72.8777</p>
              </div>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between relative z-10" style={{ borderTop: `1px solid ${GP.border}` }}>
              <p className="text-xs font-medium" style={{ color: GP.mid }}>Variance Distance</p>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums" style={{ color: GP.red }}>{fraudResult.distance.toLocaleString()} km</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: GP.mid }}>Max allowed: 50 km</p>
              </div>
            </div>
          </div>

          {Array.isArray(fraudResult.reasons) && fraudResult.reasons.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "#FCDBD9", border: `1px solid #F5C6C2` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GP.red }}>
                Fraud Signals Â· Risk score {fraudResult.riskScore ?? 0}
              </p>
              <ul className="space-y-1">
                {fraudResult.reasons.map((reason: string, idx: number) => (
                  <li key={idx} className="text-xs flex items-start gap-1.5" style={{ color: GP.dark }}>
                    <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: GP.red }} />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: GP.red }}>
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <p className="text-xs font-semibold text-white tracking-wide">POLICY SUSPENDED | PAYOUT BLOCKED | PENDING MANUAL REVIEW</p>
          </div>
        </div>
      )}

      {/* â”€â”€ SMS Preview modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {smsPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 px-5 pt-4 pb-2 flex justify-between items-center">
              <span className="text-white text-xs font-medium">9:41 AM</span>
              <div className="w-4 h-2 border border-white/60 rounded-sm relative">
                <div className="absolute inset-0.5 right-0.5 bg-white/80 rounded-sm" style={{ width: "80%" }} />
              </div>
            </div>
            <div className="bg-gray-900 px-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GP.green }}>
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">InsureGig</p>
                  <p className="text-gray-400 text-xs">to {smsPreview.phone}</p>
                </div>
                <button onClick={() => setSmsPreview(null)} className="ml-auto text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4" style={{ background: GP.light }}>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-xs">
                <p className="text-sm leading-relaxed" style={{ color: GP.dark }}>{smsPreview.message}</p>
                <p className="text-xs mt-2 text-right" style={{ color: GP.mid }}>Delivered</p>
              </div>
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "#E6F4EA", border: `1px solid #A8D5B5` }}>
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GP.green }} />
                <p className="text-xs leading-relaxed" style={{ color: GP.dark }}>
                  {t("smsNote")}
                  <span className="font-semibold block mt-1">{t("ref")}: {smsPreview.ref}</span>
                </p>
              </div>
              <button
                onClick={() => setSmsPreview(null)}
                className="w-full py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: GP.dark }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Success result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {demoState === "done" && claimResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">

          {/* Counterfactual */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: GP.blue }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white text-sm">{t("counterfactualEvaluation")}</p>
              <span className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1 bg-white/20 text-white">
                <Activity className="w-3 h-3" /> {t("aiResult")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("normalIncome"), value: `₹${claimResult.expectedIncomeWithoutDisruption}`, sub: `${t("withoutDisruption")} · ${claimResult.hoursLost}h`, dim: true },
                { label: t("actualIncome"), value: `₹${claimResult.actualIncomeWithDisruption}`, sub: t("onlyDemand", { percent: demandLevel[0] }), dim: true },
                { label: t("approvedPayout"), value: `₹${claimResult.payout}`, sub: t("instantlyCredited"), dim: false },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs text-brand-100 font-medium">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.dim ? "text-brand-100" : "text-white"}`}>{item.value}</p>
                  <p className="text-xs text-brand-200">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3 text-xs leading-relaxed text-brand-50" style={{ background: "rgba(0,0,0,0.15)" }}>
              {claimResult.explanation}
              <span className="flex items-center gap-1 mt-2 font-semibold text-green-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Fraud Check Passed Â· {Math.round(fraudResult?.distance || 0)}km IP variance Â· Risk score {fraudResult?.riskScore ?? 0}
              </span>
            </div>
          </div>

          {/* Claim card */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#A8D5B5", background: "#F6FEF8" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GP.green }}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: GP.dark }}>{t("claimApproved")}</p>
                  <p className="text-xs" style={{ color: GP.mid }}>{t("parametricTriggerConfirmed")}</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#E6F4EA", color: GP.green }}>
                {t("completed")}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {[
                {
                  label: t("disruptionTrigger"),
                  content: (
                    <div className="flex items-center gap-2 mt-1">
                      {getDisruptionIcon(claimResult.disruptionType, "w-4 h-4")}
                      <span className="text-sm font-semibold" style={{ color: GP.dark }}>{getDisruptionName(claimResult.disruptionType)}</span>
                    </div>
                  )
                },
                {
                  label: t("platformDemand"),
                  content: <p className="text-xl font-bold mt-1" style={{ color: GP.dark }}>{t("onlyLeft", { percent: demandLevel[0] })}</p>
                },
                {
                  label: t("autoPayout"),
                  content: <p className="text-xl font-bold mt-1" style={{ color: GP.green }}>₹{claimResult.payout}</p>
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 bg-white" style={{ border: `1px solid ${GP.border}` }}>
                  <p className="text-xs font-medium" style={{ color: GP.mid }}>{item.label}</p>
                  {item.content}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{ background: GP.green }}
                  >
                    <Wallet className="w-4 h-4" /> {t("viewWallet")}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-base w-full pr-6">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" style={{ color: GP.green }} /> {t("walletHistory")}
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 px-2 text-xs text-gray-400 hover:text-red-600">
                        {t("clearDemo")}
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 flex justify-between items-center" style={{ background: "#E6F4EA" }}>
                      <span className="text-sm font-medium" style={{ color: GP.dark }}>{t("totalLifetimePayouts")}</span>
                      <span className="text-xl font-bold" style={{ color: GP.green }}>
                        â‚¹{claimHistory.reduce((sum, claim) => sum + claim.payout, 0)}
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-wide font-medium flex items-center gap-1.5 mt-3" style={{ color: GP.mid }}>
                      <History className="w-3.5 h-3.5" /> {t("recentClaims")}
                    </p>
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                      {claimHistory.length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: GP.mid }}>{t("noPayoutsYet")}</p>
                      ) : (
                        [...claimHistory].reverse().map((claim, idx) => (
                          <div key={idx} className="rounded-xl p-3 bg-white flex justify-between items-center" style={{ border: `1px solid ${GP.border}` }}>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {getDisruptionIcon(claim.disruptionType, "w-3.5 h-3.5")}
                                <p className="text-sm font-semibold capitalize" style={{ color: GP.dark }}>{(claim.disruptionType || 'weather').replace('_', ' ')}</p>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: GP.mid }}>{new Date(claim.date).toLocaleDateString()} Â· {claim.hoursLost}h impact</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold" style={{ color: GP.green }}>+â‚¹{claim.payout}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: "#E6F4EA", color: GP.green }}>{t("autoApproved")}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <button
                onClick={() => toast.info("Receipt downloaded: INVG-CLAIM-" + Math.floor(Math.random() * 10000) + ".pdf")}
                className="flex-1 inline-flex items-center justify-center py-2.5 rounded-full text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: GP.border, color: GP.dark }}
              >
                {t("downloadReceipt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

