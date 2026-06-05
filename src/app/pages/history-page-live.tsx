import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { CalendarDays, TrendingDown, Cloud } from "lucide-react";
import {
  getDisruptionIcon,
  getDisruptionLabel,
  getStoredDisruptionHistory,
  type StoredDisruptionRecord,
} from "../../services/policyData";
import { useTranslation } from "react-i18next";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`;
}

export function HistoryPageLive() {
  const { t } = useTranslation("history");
  const [historyData, setHistoryData] = useState<StoredDisruptionRecord[]>([]);

  useEffect(() => {
    setHistoryData(getStoredDisruptionHistory());
  }, []);

  const orderedHistory = useMemo(() => [...historyData].reverse(), [historyData]);
  const totalPayout = historyData.reduce((sum, claim) => sum + Number(claim.payout || 0), 0);
  const totalHours = historyData.reduce((sum, claim) => sum + Number(claim.hoursLost || 0), 0);

  const groupedByType = useMemo(() => {
    return historyData.reduce<Record<string, { count: number; payout: number }>>((acc, item) => {
      const key = item.disruptionType;
      if (!acc[key]) {
        acc[key] = { count: 0, payout: 0 };
      }
      acc[key].count += 1;
      acc[key].payout += Number(item.payout || 0);
      return acc;
    }, {});
  }, [historyData]);

  const insight =
    historyData.length === 0
      ? t("noHistoryYet", "No disruption history yet. Run a claim from the Claims page to populate this table.")
      : `${getDisruptionLabel(historyData[historyData.length - 1].disruptionType)} is your latest logged disruption. History tracks the trigger event, source, lost hours, and payout for each disruption separately from the dashboard summary.`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("disruptionHistory")}</h1>
        <p className="text-gray-600">{t("historyDesc")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("totalDisruptions")}</CardTitle>
            <CalendarDays className="w-5 h-5 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{historyData.length}</div>
            <p className="text-sm text-gray-500 mt-1">{t("loggedEvents")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("totalPayouts")}</CardTitle>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalPayout)}</div>
            <p className="text-sm text-gray-500 mt-1">{t("claimedAgainst")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("hoursProtected")}</CardTitle>
            <Cloud className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalHours.toFixed(1)}h</div>
            <p className="text-sm text-gray-500 mt-1">{t("hoursCompensated")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("disruptionRecords")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("event")}</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead className="text-center">{t("hoursLost")}</TableHead>
                  <TableHead className="text-center">{t("status")}</TableHead>
                  <TableHead className="text-right">{t("payout")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {t("noHistoryYet")}
                    </TableCell>
                  </TableRow>
                ) : (
                  orderedHistory.map((claim) => {
                    const Icon = getDisruptionIcon(claim.disruptionType);
                    return (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">
                          {new Date(claim.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-brand-500" />
                            <span>{getDisruptionLabel(claim.disruptionType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{claim.source}</TableCell>
                        <TableCell className="text-gray-600">{claim.description}</TableCell>
                        <TableCell className="text-center">{claim.hoursLost}h</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-600">{claim.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(claim.payout)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("breakdownByType")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.keys(groupedByType).length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                {t("noDisruptionSummaries")}
              </div>
            ) : (
              Object.entries(groupedByType).map(([type, summary]) => {
                const Icon = getDisruptionIcon(type);
                return (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-brand-500" />
                      <div>
                        <p className="font-medium text-gray-900">{getDisruptionLabel(type)}</p>
                        <p className="text-sm text-gray-600">{summary.count === 1 ? t("eventCount", { count: 1 }) : t("eventsCount", { count: summary.count })}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(summary.payout)}</span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-6 h-6 text-brand-500 mt-0.5" />
            <div>
              <p className="font-semibold text-brand-900 mb-1">{t("insights")}</p>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
