import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { AuthPage } from "./pages/auth-page";
import { DashboardLayout } from "./pages/dashboard-layout";
import { DashboardHomeLive } from "./pages/dashboard-home-live";
import { PlansPage } from "./pages/plans-page";
import { RiskInsightsPage } from "./pages/risk-insights-page";
import { ClaimsPage } from "./pages/claims-page";
import { HistoryPageLive } from "./pages/history-page-live";
import { LiveMapPage } from "./pages/live-map-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardHomeLive },
      { path: "plans", Component: PlansPage },
      { path: "risk", Component: RiskInsightsPage },
      { path: "claims", Component: ClaimsPage },
      { path: "history", Component: HistoryPageLive },
      { path: "live-map", Component: LiveMapPage },
    ],
  },
]);
