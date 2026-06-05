import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AlertTriangle, Cloud, Wind, TrendingDown, MapPin, Navigation, Brain, Car, Smartphone } from "lucide-react";
import { fetchLiveWeather, fetchWeatherByCoords } from "../../services/weatherApi";
import { useTranslation } from "react-i18next";
import {
  loadDisruptionModel,
  isDisruptionModelReady,
  predictDisruption,
  type DisruptionForecast,
} from "../../services/mlEngine";

export function RiskInsightsPage() {
  const { t } = useTranslation("risk");
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("your area");
  const [weatherData, setWeatherData] = useState({ temp: 32, desc: "Scanning...", severity: 75 });
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [forecast, setForecast] = useState<DisruptionForecast | null>(null);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    loadDisruptionModel().then((ready) => setModelReady(ready));
  }, []);

  useEffect(() => {
    const fetchRiskData = async () => {
      const savedGps = localStorage.getItem("insuregig_gps_coords");
      const parsedGps = savedGps ? JSON.parse(savedGps) : null;
      const hasFreshTrackedGps = parsedGps && (Date.now() - parsedGps.ts < 5 * 60 * 1000);

      if (hasFreshTrackedGps) {
        const data = await fetchWeatherByCoords(parsedGps.lat, parsedGps.lon);
        if (data.success) {
          const city = data.name || "Mumbai";
          setLocationName(city);
          setWeatherData({ temp: data.temp, desc: data.description, severity: data.severity });
          setIsLiveGps(true);
          setLoading(false);
          runDisruptionModel(city, data.severity, 0);
          return;
        }
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const data = await fetchWeatherByCoords(latitude, longitude);
            if (data.success) {
              localStorage.setItem("insuregig_gps_coords", JSON.stringify({ lat: latitude, lon: longitude, ts: Date.now() }));
              const city = data.name || "Mumbai";
              setLocationName(city);
              setWeatherData({ temp: data.temp, desc: data.description, severity: data.severity });
              setIsLiveGps(true);
              setLoading(false);
              runDisruptionModel(city, data.severity, 0);
            } else {
              fallbackToProfile();
            }
          },
          () => fallbackToProfile(),
          { timeout: 5000 },
        );
      } else {
        fallbackToProfile();
      }
    };

    const fallbackToProfile = async () => {
      const savedUser = localStorage.getItem("user");
      const city = savedUser ? JSON.parse(savedUser).location : "Mumbai";
      setLocationName(city);
      const data = await fetchLiveWeather(city);
      const severity = data.success ? data.severity : 30;
      if (data.success) setWeatherData({ temp: data.temp, desc: data.description, severity });
      setLoading(false);
      runDisruptionModel(city, severity, 0);
    };

    fetchRiskData();
  }, []);

  const runDisruptionModel = async (city: string, weatherSeverity: number, rainfallMm: number) => {
    const liveAqi = 120; // placeholder until AQI API is wired
    const rainProxy = (weatherSeverity / 100) * 60; // proxy from severity
    const result = await predictDisruption(city, new Date(), liveAqi, rainProxy + rainfallMm);
    setForecast(result);
  };

  // Use model forecast if available, else fall back to weather-only score
  const riskScore = forecast
    ? forecast.overallRisk
    : loading
    ? 55
    : Math.round(Math.min(100, Math.max(5, weatherData.severity * 0.65 + 18 * 0.2 + 40 * 0.15)));

  let riskLevelLabel = t("riskLow");
  let bgGradient = "from-green-50 to-emerald-50";
  let borderColor = "border-green-200";
  let iconBg = "bg-green-500";
  let textColor = "text-green-600";

  if (riskScore > 60) {
    riskLevelLabel = t("riskHigh");
    bgGradient = "from-orange-50 to-red-50";
    borderColor = "border-orange-200";
    iconBg = "bg-orange-500";
    textColor = "text-orange-600";
  } else if (riskScore > 30) {
    riskLevelLabel = t("riskMedium");
    bgGradient = "from-yellow-50 to-amber-50";
    borderColor = "border-yellow-200";
    iconBg = "bg-yellow-500";
    textColor = "text-yellow-600";
  }

  const weatherPct  = forecast ? Math.round(forecast.weather  * 100) : weatherData.severity;
  const aqiPct      = forecast ? Math.round(forecast.aqi      * 100) : 40;
  const trafficPct  = forecast ? Math.round(forecast.traffic  * 100) : 18;
  const platformPct = forecast ? Math.round(forecast.platform * 100) : 6;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {t("title")}
          {isLiveGps && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs px-2 py-0.5">
              <Navigation className="w-3 h-3 mr-1" /> {t("liveGpsActive")}
            </Badge>
          )}
          {forecast && (
            <Badge className={`text-xs px-2 py-0.5 ${forecast.source === "model" ? "bg-brand-100 text-brand-700 border-brand-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              <Brain className="w-3 h-3 mr-1" />
              {forecast.source === "model" ? "ML Model" : "Actuarial"}
            </Badge>
          )}
        </h1>
        <p className="text-gray-600 capitalize">{t("subtitle", { location: locationName })}</p>
      </div>

      {/* Overall Risk */}
      <Card className={`${borderColor} bg-gradient-to-br ${bgGradient} transition-colors duration-500`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center transition-colors duration-500`}>
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">{t("currentRiskLevel")}</p>
                <h2 className={`text-4xl font-bold ${textColor} transition-colors duration-500`}>{riskLevelLabel}</h2>
              </div>
            </div>
            {riskScore > 60 ? (
              <Badge className="bg-red-600 text-white text-lg px-4 py-2 animate-pulse">{t("alertActive")}</Badge>
            ) : (
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">{t("safeConditions")}</Badge>
            )}
          </div>
          <Progress value={riskScore} className="h-3 shadow-inner" />
          <p className="text-sm text-gray-700 mt-2 font-medium">
            {t("aggregatedRisk", { score: riskScore })} — {riskScore > 60 ? t("multipleFactors") : t("standardBaseline")}
          </p>
        </CardContent>
      </Card>

      {/* AI Prediction narrative */}
      <Card className="border-brand-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-500" />
            {locationName} {t("aiPrediction")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg border ${riskScore > 60 ? "bg-orange-50 border-orange-200" : "bg-brand-50 border-brand-200"}`}>
            <p className={`text-lg font-semibold mb-2 ${riskScore > 60 ? "text-orange-900" : "text-brand-900"}`}>
              {t("chanceOfDisruption", { score: riskScore })}
            </p>
            <p className="text-gray-700">
              {riskScore > 60
                ? t("highRiskPrediction", { location: locationName, conditions: weatherData.desc.toLowerCase() })
                : t("lowRiskPrediction", { location: locationName, conditions: weatherData.desc.toLowerCase() })}
            </p>
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <p>{t("updatedJustNow")} · {isLiveGps ? t("sourceLiveGps") : t("sourceProfile")}</p>
            {isLiveGps && <p className="text-brand-500 font-medium text-xs">{t("latLonSynced")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Per-disruption type cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weather */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Cloud className={`w-4 h-4 ${weatherPct > 50 ? "text-brand-500" : "text-gray-500"}`} />
                {t("liveWeather")}
              </CardTitle>
              {weatherPct > 60
                ? <Badge className="bg-red-600 text-xs">{t("severe")}</Badge>
                : weatherPct > 30
                ? <Badge className="bg-yellow-500 text-xs">{t("moderate")}</Badge>
                : <Badge className="bg-green-600 text-xs">{t("normal")}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{loading ? "..." : `${weatherData.temp}°C`}</p>
            <p className="text-xs text-gray-500 capitalize">{loading ? t("scanning") : weatherData.desc}</p>
            <Progress value={weatherPct} className="h-2" />
            <p className="text-xs text-gray-400">{weatherPct}% severity</p>
          </CardContent>
        </Card>

        {/* AQI */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wind className="w-4 h-4 text-gray-400" /> {t("aqiLevel")}
              </CardTitle>
              {aqiPct > 60
                ? <Badge className="bg-red-600 text-xs">{t("severe")}</Badge>
                : <Badge variant="outline" className="text-gray-500 border-gray-200 text-xs">{t("moderate")}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-gray-700">{Math.round(aqiPct * 4 + 50)}</p>
            <p className="text-xs text-gray-500">{t("unhealthySensitive")}</p>
            <Progress value={aqiPct} className="h-2" />
            <p className="text-xs text-gray-400">{aqiPct}% {t("riskHigh").toLowerCase()} risk</p>
          </CardContent>
        </Card>

        {/* Traffic */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400" /> Traffic
              </CardTitle>
              {trafficPct > 65
                ? <Badge className="bg-red-600 text-xs">{t("severe")}</Badge>
                : <Badge variant="outline" className="text-gray-500 border-gray-200 text-xs">{t("stable")}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-gray-700">{100 - trafficPct}%</p>
            <p className="text-xs text-gray-500">{t("capacityRemaining")}</p>
            <Progress value={trafficPct} className="h-2" />
            <p className="text-xs text-gray-400">{trafficPct}% congestion level</p>
          </CardContent>
        </Card>

        {/* Platform */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" /> Platform
              </CardTitle>
              {platformPct > 30
                ? <Badge className="bg-yellow-500 text-xs">{t("moderate")}</Badge>
                : <Badge className="bg-green-600 text-xs">{t("normal")}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-gray-700">{platformPct}%</p>
            <p className="text-xs text-gray-500">Outage probability</p>
            <Progress value={platformPct} className="h-2" />
            <p className="text-xs text-gray-400">{platformPct < 15 ? "Stable" : "Elevated"} risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Risk Map placeholder */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              {t("liveRiskMap")}: <span className="capitalize border-b border-dashed border-gray-400 pb-0.5">{locationName}</span>
            </div>
            {isLiveGps && <span className="text-xs font-normal text-brand-500 flex items-center"><Navigation className="w-3 h-3 mr-1" /> {t("gpsSynced")}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-green-100 via-yellow-100 to-red-100 h-64 rounded-lg flex items-center justify-center border relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at center, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="text-center relative bg-white/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white">
              <MapPin className={`w-12 h-12 mx-auto mb-2 ${riskScore > 60 ? "text-red-600 animate-bounce" : "text-green-600"}`} />
              <p className="font-bold text-gray-900 text-lg">{riskScore > 60 ? t("highRiskZone") : t("safeOpsZone")}</p>
              <p className="text-sm text-gray-600 font-medium">{t("monitoringRadius", { location: locationName })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
