import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import {
  Shield,
  LayoutDashboard,
  FileText,
  AlertCircle,
  History,
  Settings,
  LogOut,
  Navigation,
} from "lucide-react";
import logoGig from "../../../assets/insuregig.png";
import { Button } from "../components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("dashboard");
  const [accessReady, setAccessReady] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [userName, setUserName] = useState("Gig Worker");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const paidMenuItems = [
    { path: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { path: "/dashboard/plans", label: t("myPolicy"), icon: FileText },
    { path: "/dashboard/claims", label: t("claims"), icon: AlertCircle },
    { path: "/dashboard/risk", label: t("aiRisk"), icon: Shield },
    { path: "/dashboard/live-map", label: t("liveMap"), icon: Navigation },
    { path: "/dashboard/history", label: t("history"), icon: History },
  ];
  const unpaidMenuItems = [
    { path: "/dashboard/plans", label: t("choosePlan"), icon: FileText },
  ];
  const menuItems = isPaidUser ? paidMenuItems : unpaidMenuItems;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/auth", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(savedUser);
      setUserName(user?.name?.trim() || "Gig Worker");
      const paid = user?.premiumStatus === "paid";
      setIsPaidUser(paid);
      if (!paid && location.pathname !== "/dashboard/plans") {
        navigate("/dashboard/plans", { replace: true });
        return;
      }
      setAccessReady(true);
    } catch {
      navigate("/auth", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!accessReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop only */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <img src={logoGig} alt="InsureGig" className="w-[200px] h-[80px] object-contain object-center mix-blend-multiply" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">{greeting},</p>
            <p className="text-lg font-semibold text-gray-900">{userName}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-sm text-gray-500">{t("language")}:</span>
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
            <span>{t("settings")}</span>
          </button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("logout")}</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b p-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img src={logoGig} alt="InsureGig" className="w-[150px] h-[60px] object-contain object-center shrink-0 mix-blend-multiply" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{greeting},</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top padding for mobile header, bottom padding for mobile nav */}
        <div className="md:pt-0 pt-16 pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-brand-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
