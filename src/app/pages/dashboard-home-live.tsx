import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Phone, Mail, MapPin, FileText, Camera, Sparkles, User } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import {
  getDisruptionIcon,
  getDisruptionLabel,
  getStoredClaimHistory,
  getStoredDisruptionHistory,
  getStoredUserProfile,
  type StoredClaimRecord,
  type StoredDisruptionRecord,
  type StoredUserProfile,
} from "../../services/policyData";
import { useTranslation } from "react-i18next";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`;
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function estimateWorkedHours(
  baseDailyIncome: number,
  event?: Pick<StoredDisruptionRecord, "severity" | "demandLevel">
) {
  const baselineHours = Math.min(12, Math.max(4, Math.round(baseDailyIncome / 100)));
  if (!event) return baselineHours;

  const disruptionBoost = Math.round((100 - Number(event.demandLevel || 0)) / 25 + Number(event.severity || 0) / 50);
  return Math.min(14, Math.max(4, baselineHours + disruptionBoost));
}

export function DashboardHomeLive() {
  const { t } = useTranslation("dashboard");
  const [user, setUser] = useState<StoredUserProfile>({});
  const [claimHistory, setClaimHistory] = useState<StoredClaimRecord[]>([]);
  const [disruptionHistory, setDisruptionHistory] = useState<StoredDisruptionRecord[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(getStoredUserProfile());
    setClaimHistory(getStoredClaimHistory());
    setDisruptionHistory(getStoredDisruptionHistory());
    const saved = localStorage.getItem("userProfilePhoto");
    if (saved) setProfilePhoto(saved);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem("userProfilePhoto", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const weeklyChartData = useMemo(() => {
    const recentClaims = [...claimHistory].slice(-7);
    const baseIncome = Number(user.dailyIncome) || 500;

    if (recentClaims.length === 0) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        actual: baseIncome,
        protected: baseIncome + (Number(user.premiumPaid) || 0) * 20,
      }));
    }

    return recentClaims.map((claim) => ({
      day: formatDateLabel(claim.date),
      actual: claim.actualIncomeWithDisruption,
      protected: claim.expectedIncomeWithoutDisruption,
    }));
  }, [claimHistory, user.dailyIncome, user.premiumPaid]);

  const totalPayout = claimHistory.reduce((sum, claim) => sum + Number(claim.payout || 0), 0);
  const maxCoverage = (Number(user.premiumPaid) || 0) * 60;
  const latestDisruption = disruptionHistory[disruptionHistory.length - 1];
  const recentClaims = [...claimHistory].reverse().slice(0, 3);
  const claimCount = claimHistory.length;
  const estimatedBaseHours = estimateWorkedHours(Number(user.dailyIncome) || 500);
  const workdayStats = useMemo(() => {
    const recordedDays = disruptionHistory.map((event) => ({
      date: event.date,
      workedHours: estimateWorkedHours(Number(user.dailyIncome) || 500, event),
    }));

    const days = recordedDays.length > 0 ? recordedDays : [{ date: new Date().toISOString(), workedHours: estimatedBaseHours }];
    const highestDay = days.reduce((highest, current) => (current.workedHours > highest.workedHours ? current : highest), days[0]);
    const averageHours = days.reduce((sum, day) => sum + day.workedHours, 0) / days.length;

    return {
      activeDays: days.length,
      highestWorkedHours: highestDay.workedHours,
      highestWorkedDate: highestDay.date,
      averageHours,
    };
  }, [disruptionHistory, estimatedBaseHours, user.dailyIncome]);

  return (
    <div className="p-6 space-y-6 relative">
      <motion.div
        className="absolute top-10 right-10 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-gray-900">{t("dashboard")}</h1>
        <p className="text-gray-600">{t("welcomeBack")}</p>
      </motion.div>

      <div className="grid xl:grid-cols-[1.55fr_0.95fr] gap-6 items-start">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <Card className="relative overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-brand-400/15 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                {t("memberSnapshot")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex items-center gap-4 lg:w-72 lg:shrink-0">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <motion.div
                    className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-3xl shadow-lg overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => photoInputRef.current?.click()}
                    title="Click to upload profile photo"
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-300 text-white">
                        <User className="w-10 h-10 opacity-90" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-[10px] text-white font-medium leading-tight text-center px-1">
                        {profilePhoto ? t("changePhoto") : t("addPhoto")}
                      </span>
                    </div>
                  </motion.div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name || t("gigWorker")}</h2>
                    <p className="text-sm text-gray-500">{user.platform || t("deliveryPartner")} {t("inString")} {user.location || "India"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-brand-100 text-brand-700 hover:bg-brand-100">{claimCount} {t("claimsRecorded")}</Badge>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{formatCurrency(totalPayout)} {t("paidOut")}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm text-sm">
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <Phone className="h-4 w-4 text-brand-500" />
                      {t("phoneTitle")}
                    </p>
                    <p className="text-gray-800">{user.phone || t("notAdded")}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm text-sm">
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <Mail className="h-4 w-4 text-brand-500" />
                      {t("emailTitle")}
                    </p>
                    <p className="text-gray-800 break-all">{user.email || t("notAdded")}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm text-sm">
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      {t("locationTitle")}
                    </p>
                    <p className="text-gray-800">{user.location || t("notAdded")}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm text-sm">
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <Shield className="h-4 w-4 text-brand-500" />
                      {t("policyTitle")}
                    </p>
                    <p className="text-gray-800">{user.planType ? `${user.planType[0].toUpperCase()}${user.planType.slice(1)} ${t("planActive")}` : t("noPlanSelected")}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">{t("daysActive")}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{workdayStats.activeDays}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">{t("highestHoursWorked")}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{workdayStats.highestWorkedHours}h</p>
                  <p className="mt-1 text-xs text-gray-500">{formatFullDate(workdayStats.highestWorkedDate)}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">{t("averageDailyHours")}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{workdayStats.averageHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <motion.div initial={{ opacity: 0, y: 50, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.6, delay: 0.1 }} whileHover={{ y: -10, rotateY: 5, scale: 1.03 }} style={{ transformStyle: "preserve-3d" }}>
            <Card className="relative overflow-hidden h-full">
              <motion.div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-5">
                <CardTitle className="text-sm font-medium text-gray-600">{t("weeklyEarningsProtected")}</CardTitle>
                <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                  <Shield className="w-5 h-5 text-brand-500" />
                </motion.div>
              </CardHeader>
              <CardContent className="pt-1 pb-5">
                <motion.div className="text-2xl font-bold text-gray-900" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.3 }}>
                  {formatCurrency((Number(user.dailyIncome) || 500) * 7)}
                </motion.div>
                <p className="text-sm text-gray-500 mt-1">{user.planType ? `${user.planType[0].toUpperCase()}${user.planType.slice(1)} ${t("planActive")}` : t("planPending")}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -10, rotateY: 5, scale: 1.03 }} style={{ transformStyle: "preserve-3d" }}>
            <Card className="relative overflow-hidden h-full">
              <motion.div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-2xl" animate={{ scale: [1.3, 1, 1.3], opacity: [0.5, 0.3, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-5">
                <CardTitle className="text-sm font-medium text-gray-600">{t("activeCoverage")}</CardTitle>
                <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </motion.div>
              </CardHeader>
              <CardContent className="pt-1 pb-5">
                <motion.div className="text-2xl font-bold text-green-600" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.4 }}>
                  {formatCurrency(maxCoverage)}
                </motion.div>
                <p className="text-sm text-gray-500 mt-1">{t("maximumPayoutAvailable")}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.6, delay: 0.3 }} whileHover={{ y: -10, rotateY: 5, scale: 1.03 }} style={{ transformStyle: "preserve-3d" }}>
            <Card className="relative overflow-hidden h-full sm:col-span-2 xl:col-span-1">
              <motion.div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-5">
                <CardTitle className="text-sm font-medium text-gray-600">{t("latestDisruption")}</CardTitle>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </motion.div>
              </CardHeader>
              <CardContent className="pt-1 pb-5">
                <motion.div className="text-2xl font-bold text-orange-600 leading-tight" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.5 }}>
                  {latestDisruption ? getDisruptionLabel(latestDisruption.disruptionType) : t("noEvents")}
                </motion.div>
                <p className="text-sm text-gray-500 mt-1">
                  {latestDisruption ? t("severityAndDemand", { severity: latestDisruption.severity, demand: latestDisruption.demandLevel }) : t("runClaimToStartTracking")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <Card className="relative overflow-hidden">
          <motion.div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {t("earningsVsProtected")}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="actual" stroke="#009AFD" strokeWidth={2} name={t("actualEarnings")} />
                <Line type="monotone" dataKey="protected" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name={t("protectedIncome")} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <Card className="border-orange-200 bg-orange-50 relative overflow-hidden h-full">
            <motion.div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            <CardHeader>
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </motion.div>
                <CardTitle className="text-orange-900">{t("activeAlerts")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10 min-h-[220px]">
              {disruptionHistory.length === 0 ? (
                <div className="flex min-h-[156px] items-center rounded-lg bg-white p-4 text-sm text-gray-600">{t("noDisruptionAlerts")}</div>
              ) : (
                [...disruptionHistory].reverse().slice(0, 2).map((event) => {
                  const Icon = getDisruptionIcon(event.disruptionType);
                  return (
                    <motion.div
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg"
                      whileHover={{ x: 10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{getDisruptionLabel(event.disruptionType)}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-700 border-orange-300">{event.status}</Badge>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              <div className="space-y-4">
                {recentClaims.length === 0 ? (
                  <div className="flex min-h-[156px] items-center text-sm text-gray-600">{t("noClaimActivity")}</div>
                ) : (
                  recentClaims.map((claim, index) => {
                    const claimEvent = disruptionHistory.find((event) => event.id === claim.id);
                    const Icon = index === 0 ? CheckCircle : index === 1 ? Clock : Shield;
                    return (
                      <motion.div
                        key={claim.id}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ x: 10, scale: 1.02 }}
                      >
                        <motion.div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: index === 0 ? "rgb(220, 252, 231)" : index === 1 ? "rgb(205, 235, 255)" : "rgb(243, 232, 255)" }}
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <Icon className="w-5 h-5" style={{ color: index === 0 ? "#16a34a" : index === 1 ? "#009AFD" : "#9333ea" }} />
                        </motion.div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{getDisruptionLabel(claim.disruptionType)} {t("claimApproved")}</p>
                          <p className="text-sm text-gray-600">{claimEvent ? claimEvent.description : claim.explanation}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(claim.date)}</p>
                        </div>
                        <motion.span className="text-green-600 font-semibold" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 1 + index * 0.1 }}>
                          +{formatCurrency(claim.payout)}
                        </motion.span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  );
}
