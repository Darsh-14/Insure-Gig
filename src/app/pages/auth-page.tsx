import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import logoGig from "../../../assets/insuregig.png";
import { supabase } from "../../services/supabaseClient";
import { useTranslation } from "react-i18next";

export function AuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "common"]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    platform: "",
    location: "",
    vehicle: "bike",
    dailyIncome: "",
    persona: "hustler",
  });
  
  const continueToPlans = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^\+?[0-9]{10,14}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!formData.name || !formData.location || !formData.dailyIncome) {
      toast.error("Please fill out all required fields properly.");
      return;
    }

    const userData = {
      ...formData,
      dailyIncome: Number(formData.dailyIncome) || 0,
      premiumStatus: "pending",
    };

    if (supabase) {
      const { error } = await supabase.from("users").upsert(
        {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          platform: userData.platform,
          location: userData.location,
          vehicle: userData.vehicle,
          daily_income: userData.dailyIncome,
          premium_status: "pending",
          plan_type: "none",
        },
        { onConflict: "email" },
      );
      if (error) {
        console.error("Supabase user insert error:", error);
        toast.error(`Backend Sync Error: ${error.message || "Failed to update database"}`);
      }
    }

    localStorage.setItem("user", JSON.stringify(userData));
    navigate("/dashboard/plans");
  };

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address to login.");
      return;
    }

    if (supabase) {
      const { data, error } = await supabase.from("users").select("*").eq("email", formData.email).maybeSingle();
      
      if (error || !data) {
        toast.error("User not found or error occurred. Please sign up.");
        return;
      }
      
      const dbUser = {
        name: data.name || formData.name,
        email: data.email,
        phone: data.phone || formData.phone,
        platform: data.platform || formData.platform,
        location: data.location || formData.location,
        vehicle: data.vehicle || formData.vehicle,
        dailyIncome: data.daily_income || formData.dailyIncome,
        premiumStatus: data.premium_status || "pending",
        planType: data.plan_type || "none",
      };
      
      localStorage.setItem("user", JSON.stringify(dbUser));
      
      if (dbUser.planType !== "none" && dbUser.planType) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard/plans");
      }
    } else {
      toast.error("Backend not configured.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md my-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoGig} alt="InsureGig" className="w-[250px] h-[100px] object-contain object-center mix-blend-multiply" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("getStarted")}</CardTitle>
            <CardDescription>{t("authDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                continueToPlans();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input
                  id="name"
                  placeholder={t("enterName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  placeholder={t("enterPhone")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("emailAddress")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyIncome">{t("dailyIncome")}</Label>
                <Input
                  id="dailyIncome"
                  type="number"
                  value={formData.dailyIncome}
                  onChange={(e) => setFormData({ ...formData, dailyIncome: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 font-medium mt-1">
                  NOTE : This amount will be used to calculate your plan.
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("primaryVehicle")}</Label>
                <Select
                  value={formData.vehicle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectVehicle")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">{t("motorbike")}</SelectItem>
                    <SelectItem value="scooter">{t("scooter")}</SelectItem>
                    <SelectItem value="electric_scooter">
                      {t("electricScooter")}
                    </SelectItem>
                    <SelectItem value="cycle">{t("bicycle")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">{t("deliveryPlatform")}</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectPlatform")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swiggy">Swiggy</SelectItem>
                    <SelectItem value="zomato">Zomato</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t("deliveryZone")}</Label>
                <Input
                  id="location"
                  placeholder={t("enterLocation")}
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("workerPersona")}</Label>
                <Select
                  value={formData.persona}
                  onValueChange={(value) =>
                    setFormData({ ...formData, persona: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectPersona")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hustler">{t("hustler")}</SelectItem>
                    <SelectItem value="night_owl">{t("nightOwl")}</SelectItem>
                    <SelectItem value="fair_weather">
                      {t("fairWeather")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("signUp")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
