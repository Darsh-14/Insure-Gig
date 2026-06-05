import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Cloud, Wind, TrendingDown, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

export function HistoryPage() {
  const { t } = useTranslation("history");

  const historyData = [
    {
      id: "CLM-2026-0317",
      date: "17 Mar 2026",
      eventKey: "heavyRain",
      icon: Cloud,
      descriptionKey: "heavyRainDesc",
      payout: 360,
      statusKey: "completed",
      hoursLost: "3h",
    },
    {
      id: "CLM-2026-0315",
      date: "15 Mar 2026",
      eventKey: "poorAqi",
      icon: Wind,
      descriptionKey: "poorAqiDesc",
      payout: 200,
      statusKey: "completed",
      hoursLost: "2h",
    },
    {
      id: "CLM-2026-0312",
      date: "12 Mar 2026",
      eventKey: "rain",
      icon: Cloud,
      descriptionKey: "rainDesc",
      payout: 300,
      statusKey: "completed",
      hoursLost: "2.5h",
    },
    {
      id: "CLM-2026-0310",
      date: "10 Mar 2026",
      eventKey: "lowDemand",
      icon: TrendingDown,
      descriptionKey: "lowDemandDesc",
      payout: 250,
      statusKey: "completed",
      hoursLost: "4h",
    },
    {
      id: "CLM-2026-0308",
      date: "8 Mar 2026",
      eventKey: "heavyRain",
      icon: Cloud,
      descriptionKey: "severeRainDesc",
      payout: 400,
      statusKey: "completed",
      hoursLost: "3.5h",
    },
    {
      id: "CLM-2026-0305",
      date: "5 Mar 2026",
      eventKey: "aqiWarning",
      icon: Wind,
      descriptionKey: "veryPoorAqiDesc",
      payout: 180,
      statusKey: "completed",
      hoursLost: "1.5h",
    },
  ];

  const totalPayout = historyData.reduce((sum, claim) => sum + claim.payout, 0);
  const totalHours = historyData.reduce((sum, claim) => sum + parseFloat(claim.hoursLost), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600">{t("subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("totalClaims")}</CardTitle>
            <CalendarDays className="w-5 h-5 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{historyData.length}</div>
            <p className="text-sm text-gray-500 mt-1">{t("allTime")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("totalPayouts")}</CardTitle>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{totalPayout.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-1">{t("incomeProtected")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("hoursProtected")}</CardTitle>
            <Cloud className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalHours}h</div>
            <p className="text-sm text-gray-500 mt-1">{t("hoursCompensated")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("claimRecords")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("event")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead className="text-center">{t("hoursLost")}</TableHead>
                  <TableHead className="text-center">{t("status")}</TableHead>
                  <TableHead className="text-right">{t("payout")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((claim) => {
                  const Icon = claim.icon;
                  return (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-brand-500" />
                          <span>{t(claim.eventKey)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{t(claim.descriptionKey)}</TableCell>
                      <TableCell className="text-center">{claim.hoursLost}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-600">{t(claim.statusKey)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">₹{claim.payout}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("monthlyBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="font-medium text-gray-900">{t("rainClaims")}</p>
                  <p className="text-sm text-gray-600">3 {t("claims")}</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">₹1,060</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">{t("aqiClaims")}</p>
                  <p className="text-sm text-gray-600">2 {t("claims")}</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">₹380</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">{t("lowDemandClaims")}</p>
                  <p className="text-sm text-gray-600">1 {t("claim")}</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">₹250</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg border-2 border-green-300 mt-4">
              <div>
                <p className="font-semibold text-green-900">{t("marchTotal")}</p>
                <p className="text-sm text-gray-700">{t("claimsProcessed", { count: 6 })}</p>
              </div>
              <span className="text-2xl font-bold text-green-700">₹{totalPayout.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-6 h-6 text-brand-500 mt-0.5" />
            <div>
              <p className="font-semibold text-brand-900 mb-1">{t("insights")}</p>
              <p className="text-sm text-gray-700">{t("insightsText")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
