import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, Star, Shield, Sparkles, Zap, Info } from "lucide-react";
import type { PremiumInputs } from "../../services/mlEngine";
import { toast } from "sonner";
import { motion } from "motion/react";
import { PayNowButton } from "../components/ui/PayNowButton";
import { mockApi } from "../../services/mockApi";
import { isPremiumModelReady, loadPremiumModel } from "../../services/mlEngine";
import { useTranslation } from "react-i18next";
import { supabase } from "../../services/supabaseClient";

const MIN_WEEKLY_PREMIUM = 20;
const MAX_WEEKLY_PREMIUM = 70;

function clampPremium(amount: number, min = MIN_WEEKLY_PREMIUM, max = MAX_WEEKLY_PREMIUM) {
  return Math.min(max, Math.max(min, Math.round(amount)));
}

function formatCurrency(amount: number) {
  return `\u20B9${amount}`;
}

export function PlansPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("plans");
  const [selectedPlan, setSelectedPlan] = useState<"normal" | "premium">("premium");
  const [purchasedPlan, setPurchasedPlan] = useState<"normal" | "premium" | null>(null);
  const [normalPlanPremium, setNormalPlanPremium] = useState(25);
  const [premiumPlanPremium, setPremiumPlanPremium] = useState(35);
  const [isCalculatingPremium, setIsCalculatingPremium] = useState(true);
  const [actuarialInputs, setActuarialInputs] = useState<PremiumInputs | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydratePlans = async () => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        if (isMounted) {
          setIsCalculatingPremium(false);
        }
        return;
      }

      try {
        const user = JSON.parse(savedUser);
        if (user?.planType === "normal" || user?.planType === "premium") {
          setSelectedPlan(user.planType);
        }
        if (user?.premiumStatus === "paid" && (user?.planType === "normal" || user?.planType === "premium")) {
          setPurchasedPlan(user.planType);
        }

        const cachedBasePremium =
          typeof user?.calculatedPremium === "number" && Number.isFinite(user.calculatedPremium)
            ? clampPremium(user.calculatedPremium)
            : null;

        let basePremium = cachedBasePremium;

        if (basePremium === null) {
          if (!isPremiumModelReady()) {
            await loadPremiumModel();
          }

          const breakdown = mockApi.calculatePremiumBreakdown({
            dailyIncome: Number(user?.dailyIncome) || 500,
            vehicle: user?.vehicle || "motorcycle",
            zone: user?.location || "Urban",
            persona: user?.persona || "hustler",
          });
          basePremium = breakdown.premium;
          if (isMounted) setActuarialInputs(breakdown.inputs);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              calculatedPremium: basePremium,
            }),
          );
        }

        if (!isMounted) return;

        const normalPremium = 28;
        const premiumPremium = clampPremium(basePremium, 30, MAX_WEEKLY_PREMIUM);

        setNormalPlanPremium(normalPremium);
        setPremiumPlanPremium(premiumPremium);
      } catch (error) {
        console.warn("[InsureGig] Unable to calculate plan pricing from the saved profile.", error);
        if (isMounted) {
          setNormalPlanPremium(25);
          setPremiumPlanPremium(35);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingPremium(false);
        }
      }
    };

    hydratePlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPlan = (plan: "normal" | "premium") => {
    if (purchasedPlan) return;
    setSelectedPlan(plan);
    toast.success(`${plan === "normal" ? t("normalPlan") : t("premiumPlan")} selected.`);
  };

  const activatePlan = async (plan: "normal" | "premium", premiumAmount: number, paymentId: string) => {
    setPurchasedPlan(plan);
    setSelectedPlan(plan);

    const savedUser = localStorage.getItem("user");
    const parsedUser = savedUser ? JSON.parse(savedUser) : {};
    const updatedUser = {
      ...parsedUser,
      premiumPaid: premiumAmount,
      premiumStatus: "paid",
      paymentId,
      planType: plan,
    };
    
    localStorage.setItem("user", JSON.stringify(updatedUser));

    if (supabase && updatedUser.email) {
      const { error } = await supabase.from("users").update({
        premium_status: "paid",
        plan_type: plan,
      }).eq("email", updatedUser.email);
      if (error) {
        console.error("Supabase plan update error:", error);
        toast.error(`Plan Sync Error: ${error.message || "Failed to update database"}`);
      }
    }

    toast.success(`${plan === "normal" ? t("normalPlan") : t("premiumPlan")} activated.`);
    navigate("/dashboard");
  };

  return (
    <div className="p-6 space-y-6 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, 50, 0], x: [0, 30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, -40, 0], x: [0, -20, 0], scale: [1.2, 1, 1.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-gray-600">{t("pageSubtitle")}</p>
      </motion.div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-brand-400/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Shield className="w-10 h-10 text-brand-500" />
                </motion.div>
                <div>
                  <p className="text-sm text-brand-900 font-medium">{t("currentPlan")}</p>
                  <p className="text-2xl font-bold text-brand-900 flex items-center gap-2">
                    {selectedPlan === "normal" ? t("normalPlan") : t("premiumPlan")}
                    {selectedPlan === "premium" && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </motion.div>
                    )}
                  </p>
                </div>
              </div>
              <Badge className={purchasedPlan ? "bg-green-600 px-3 py-1 shadow-md shadow-green-200" : "bg-brand-500 shadow-md shadow-brand-200"}>
                {purchasedPlan ? t("policyActive") : t("pendingPayment")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        {/* Normal Plan */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotateY: -20 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          whileHover={{ y: -15, rotateY: 5, scale: 1.03 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card className={`relative overflow-hidden h-full ${selectedPlan === "normal" ? "border-brand-500 border-2" : ""}`}>
            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-brand-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <CardHeader className="relative z-10">
              <motion.div className="flex items-center gap-2 mb-2" whileHover={{ x: 10 }}>
                <Shield className="w-6 h-6 text-brand-500" />
                <CardTitle className="text-2xl">{t("normalPlan")}</CardTitle>
              </motion.div>
              <CardDescription>{t("normalPlanDesc")}</CardDescription>
              <motion.div
                className="mt-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
              >
                <span className="text-4xl font-bold text-gray-900">{formatCurrency(normalPlanPremium)}</span>
                <span className="text-gray-600">{t("perWeek")}</span>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-3">
                {[
                  t("normalFeatures.coverage", { amount: formatCurrency(normalPlanPremium * 40) }),
                  t("normalFeatures.weather"),
                  t("normalFeatures.rain"),
                  t("normalFeatures.aiAlerts"),
                  t("normalFeatures.claimTime"),
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 10 }}
                  >
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div whileHover={purchasedPlan ? {} : { scale: 1.05 }} whileTap={purchasedPlan ? {} : { scale: 0.95 }}>
                {purchasedPlan === "normal" ? (
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl font-semibold">
                    {t("policyActive")}
                  </div>
                ) : purchasedPlan ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-500 shadow-none border-0">{t("planUnavailable")}</Button>
                ) : isCalculatingPremium ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-500 shadow-none border-0">{t("calculatingPremium")}</Button>
                ) : (
                  <div onClick={() => handleSelectPlan("normal")}>
                    <PayNowButton
                      premiumAmount={normalPlanPremium}
                      planName="Normal"
                      period="week"
                      onSuccess={(paymentId) => {
                        activatePlan("normal", normalPlanPremium, paymentId);
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotateY: 20 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ y: -15, rotateY: -5, scale: 1.03 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card className={`relative overflow-hidden h-full ${selectedPlan === "premium" ? "border-brand-500 border-2" : ""} bg-gradient-to-br from-white to-brand-50`}>
            <motion.div
              className="absolute top-4 right-4 z-20"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                {t("recommended")}
              </Badge>
            </motion.div>

            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl"
              animate={{ scale: [1.3, 1, 1.3], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <CardHeader className="relative z-10">
              <motion.div className="flex items-center gap-2 mb-2" whileHover={{ x: 10 }}>
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <CardTitle className="text-2xl flex items-center gap-2">
                  {t("premiumPlan")}
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </CardTitle>
              </motion.div>
              <CardDescription>{t("premiumPlanDesc")}</CardDescription>
              <motion.div
                className="mt-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.6 }}
              >
                <span className="text-4xl font-bold text-gray-900">{formatCurrency(premiumPlanPremium)}</span>
                <span className="text-gray-600">{t("perWeek")}</span>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-3">
                {[
                  { text: t("premiumFeatures.coverage", { amount: formatCurrency(premiumPlanPremium * 60) }), bold: true },
                  { text: t("premiumFeatures.fullWeather"), bold: false },
                  { text: t("premiumFeatures.allDisruptions"), bold: false },
                  { text: t("premiumFeatures.instantPayouts"), bold: true },
                  { text: t("premiumFeatures.priorityAI"), bold: false },
                  { text: t("premiumFeatures.aqiCoverage"), bold: false },
                  { text: t("premiumFeatures.support"), bold: false },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ x: 10 }}
                  >
                    <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ type: "spring" }}>
                      <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    </motion.div>
                    <span className={`text-gray-700 ${feature.bold ? "font-medium" : ""}`}>
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              <motion.div whileHover={purchasedPlan ? {} : { scale: 1.05 }} whileTap={purchasedPlan ? {} : { scale: 0.95 }}>
                {purchasedPlan === "premium" ? (
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl font-semibold">
                    {t("policyActive")}
                  </div>
                ) : purchasedPlan ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-500 shadow-none border-0">{t("planUnavailable")}</Button>
                ) : isCalculatingPremium ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-500 shadow-none border-0">{t("calculatingPremium")}</Button>
                ) : (
                  <div onClick={() => handleSelectPlan("premium")}>
                    <PayNowButton
                      premiumAmount={premiumPlanPremium}
                      planName="Premium"
                      period="week"
                      onSuccess={(paymentId) => {
                        activatePlan("premium", premiumPlanPremium, paymentId);
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Actuarial Breakdown */}
      {actuarialInputs && !isCalculatingPremium && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-brand-100 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Info className="w-4 h-4 text-brand-500" />
                {t("actuarialTitle")}
              </CardTitle>
              <CardDescription>{t("actuarialSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  {
                    label: "Trigger probability",
                    value: `${(actuarialInputs.triggerProbability * 100).toFixed(1)}%`,
                    note: `City base × peril type × activity tier`,
                  },
                  {
                    label: "Avg income at risk / day",
                    value: `₹${Math.round(actuarialInputs.avgIncomeLostPerDay)}`,
                    note: `Daily income × loss fraction × activity factor`,
                  },
                  {
                    label: "Days exposed",
                    value: `${actuarialInputs.daysExposed} days`,
                    note: `Typical disruption duration for your peril type`,
                  },
                  {
                    label: "Base premium",
                    value: `₹${actuarialInputs.basePremium.toFixed(2)}`,
                    note: `trigger% × income at risk × days exposed`,
                    highlight: true,
                  },
                  {
                    label: "City adjustment",
                    value: `×${actuarialInputs.cityFactor.toFixed(2)}`,
                    note: `Metropolitan 1.12×  ·  Urban 1.00×  ·  Semi-Urban 0.90×`,
                  },
                  {
                    label: "Peril adjustment",
                    value: `×${actuarialInputs.perilFactor.toFixed(2)}`,
                    note: `Weather 1.15×  ·  AQI 1.08×  ·  Traffic 1.03×  ·  Platform 1.00×`,
                  },
                  {
                    label: "Activity tier adjustment",
                    value: `×${actuarialInputs.activityFactor.toFixed(2)}`,
                    note: `High (Hustler) 1.14×  ·  Medium 1.00×  ·  Low 0.90×`,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-start justify-between gap-4 py-2 px-3 rounded-lg ${row.highlight ? "bg-brand-50 border border-brand-100" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${row.highlight ? "text-brand-800" : "text-gray-700"}`}>{row.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{row.note}</p>
                    </div>
                    <span className={`font-semibold shrink-0 tabular-nums ${row.highlight ? "text-brand-700" : "text-gray-800"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}

                <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex items-center justify-between px-3">
                  <div>
                    <p className="font-semibold text-gray-900">{t("weeklyPremium")}</p>
                    <p className="text-xs text-gray-400">{t("weeklyPremiumNote")}</p>
                  </div>
                  <span className="text-2xl font-bold text-brand-600">₹{premiumPlanPremium}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Card className="relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("comparisonTitle")}
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Zap className="w-5 h-5 text-yellow-500" />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">{t("comparisonFeature")}</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">{t("comparisonNormal")}</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">{t("comparisonPremium")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: t("comparisonRows.weeklyCost"), normal: formatCurrency(normalPlanPremium), premium: formatCurrency(premiumPlanPremium), type: "text" },
                    { feature: t("comparisonRows.maxCoverage"), normal: formatCurrency(normalPlanPremium * 40), premium: formatCurrency(premiumPlanPremium * 60), type: "text" },
                    { feature: t("comparisonRows.claimTime"), normal: t("claimTimeNormal"), premium: t("claimTimePremium"), type: "highlight" },
                    { feature: t("comparisonRows.rainCoverage"), normal: "check", premium: "check", type: "check" },
                    { feature: t("comparisonRows.aqiCoverage"), normal: "-", premium: "check", type: "check" },
                    { feature: t("comparisonRows.allDisruptions"), normal: "-", premium: "check", type: "check" },
                  ].map((row, index) => (
                    <motion.tr
                      key={row.feature}
                      className="border-b"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {row.type === "check" ? (
                          row.normal === "check" ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">{row.normal}</span>
                          )
                        ) : (
                          <span>{row.normal}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.type === "check" ? (
                          row.premium === "check" ? (
                            <motion.div whileHover={{ scale: 1.3, rotate: 360 }} transition={{ type: "spring" }}>
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            </motion.div>
                          ) : (
                            <span className="text-gray-400">{row.premium}</span>
                          )
                        ) : row.type === "highlight" ? (
                          <span className="font-semibold text-green-600">{row.premium}</span>
                        ) : (
                          <span className="font-semibold">{row.premium}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
