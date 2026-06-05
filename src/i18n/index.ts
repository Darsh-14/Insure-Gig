import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enPlans from "./locales/en/plans.json";
import enClaims from "./locales/en/claims.json";
import enRisk from "./locales/en/risk.json";
import enHistory from "./locales/en/history.json";
import enLivemap from "./locales/en/livemap.json";

import hiCommon from "./locales/hi/common.json";
import hiLanding from "./locales/hi/landing.json";
import hiAuth from "./locales/hi/auth.json";
import hiDashboard from "./locales/hi/dashboard.json";
import hiPlans from "./locales/hi/plans.json";
import hiClaims from "./locales/hi/claims.json";
import hiRisk from "./locales/hi/risk.json";
import hiHistory from "./locales/hi/history.json";
import hiLivemap from "./locales/hi/livemap.json";

import taCommon from "./locales/ta/common.json";
import taLanding from "./locales/ta/landing.json";
import taAuth from "./locales/ta/auth.json";
import taDashboard from "./locales/ta/dashboard.json";
import taPlans from "./locales/ta/plans.json";
import taClaims from "./locales/ta/claims.json";
import taRisk from "./locales/ta/risk.json";
import taHistory from "./locales/ta/history.json";
import taLivemap from "./locales/ta/livemap.json";

import mrCommon from "./locales/mr/common.json";
import mrLanding from "./locales/mr/landing.json";
import mrAuth from "./locales/mr/auth.json";
import mrDashboard from "./locales/mr/dashboard.json";
import mrPlans from "./locales/mr/plans.json";
import mrClaims from "./locales/mr/claims.json";
import mrRisk from "./locales/mr/risk.json";
import mrHistory from "./locales/mr/history.json";
import mrLivemap from "./locales/mr/livemap.json";

import teCommon from "./locales/te/common.json";
import teLanding from "./locales/te/landing.json";
import teAuth from "./locales/te/auth.json";
import teDashboard from "./locales/te/dashboard.json";
import tePlans from "./locales/te/plans.json";
import teClaims from "./locales/te/claims.json";
import teRisk from "./locales/te/risk.json";
import teHistory from "./locales/te/history.json";
import teLivemap from "./locales/te/livemap.json";

import guCommon from "./locales/gu/common.json";
import guLanding from "./locales/gu/landing.json";
import guAuth from "./locales/gu/auth.json";
import guDashboard from "./locales/gu/dashboard.json";
import guPlans from "./locales/gu/plans.json";
import guClaims from "./locales/gu/claims.json";
import guRisk from "./locales/gu/risk.json";
import guHistory from "./locales/gu/history.json";
import guLivemap from "./locales/gu/livemap.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "ta", "mr", "te", "gu"],
    defaultNS: "common",
    fallbackNS: "common",
    ns: ["common", "landing", "auth", "dashboard", "plans", "claims", "risk", "history", "livemap"],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { common: enCommon, landing: enLanding, auth: enAuth, dashboard: enDashboard, plans: enPlans, claims: enClaims, risk: enRisk, history: enHistory, livemap: enLivemap },
      hi: { common: hiCommon, landing: hiLanding, auth: hiAuth, dashboard: hiDashboard, plans: hiPlans, claims: hiClaims, risk: hiRisk, history: hiHistory, livemap: hiLivemap },
      ta: { common: taCommon, landing: taLanding, auth: taAuth, dashboard: taDashboard, plans: taPlans, claims: taClaims, risk: taRisk, history: taHistory, livemap: taLivemap },
      mr: { common: mrCommon, landing: mrLanding, auth: mrAuth, dashboard: mrDashboard, plans: mrPlans, claims: mrClaims, risk: mrRisk, history: mrHistory, livemap: mrLivemap },
      te: { common: teCommon, landing: teLanding, auth: teAuth, dashboard: teDashboard, plans: tePlans, claims: teClaims, risk: teRisk, history: teHistory, livemap: teLivemap },
      gu: { common: guCommon, landing: guLanding, auth: guAuth, dashboard: guDashboard, plans: guPlans, claims: guClaims, risk: guRisk, history: guHistory, livemap: guLivemap },
    },
  });

export default i18n;
