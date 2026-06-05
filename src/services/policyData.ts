import { AlertTriangle, Car, Cloud, Smartphone, Wind } from "lucide-react";

const CLAIM_HISTORY_KEY = "claimHistory";
const DISRUPTION_HISTORY_KEY = "disruptionHistory";

export interface StoredUserProfile {
  name?: string;
  email?: string;
  phone?: string;
  platform?: string;
  location?: string;
  vehicle?: string;
  dailyIncome?: number;
  premiumPaid?: number;
  premiumStatus?: string;
  paymentId?: string;
  planType?: string;
}

export interface StoredClaimRecord {
  id: string;
  date: string;
  disruptionType: string;
  payout: number;
  hoursLost: number;
  expectedIncomeWithoutDisruption: number;
  actualIncomeWithDisruption: number;
  expectedLoss: number;
  approved: boolean;
  explanation: string;
}

import { supabase } from "./supabaseClient";

export interface StoredDisruptionRecord {
  id: string;
  date: string;
  disruptionType: string;
  severity: number;
  demandLevel: number;
  payout: number;
  hoursLost: number;
  status: "Completed" | "Blocked";
  source: string;
  description: string;
}

export function getStoredUserProfile(): StoredUserProfile {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getStoredClaimHistory(): StoredClaimRecord[] {
  try {
    const saved = localStorage.getItem(CLAIM_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getStoredDisruptionHistory(): StoredDisruptionRecord[] {
  try {
    const saved = localStorage.getItem(DISRUPTION_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveStoredClaimHistory(records: StoredClaimRecord[]) {
  localStorage.setItem(CLAIM_HISTORY_KEY, JSON.stringify(records));
  if (supabase) {
    supabase.from('claims').upsert(records).then(({ error }) => {
      if (error) console.error("Supabase claims sync error:", error);
    });
  }
}

export function saveStoredDisruptionHistory(records: StoredDisruptionRecord[]) {
  localStorage.setItem(DISRUPTION_HISTORY_KEY, JSON.stringify(records));
  if (supabase) {
    supabase.from('disruptions').upsert(records).then(({ error }) => {
      if (error) console.error("Supabase disruptions sync error:", error);
    });
  }
}

export function clearStoredClaimData() {
  localStorage.removeItem(CLAIM_HISTORY_KEY);
  localStorage.removeItem(DISRUPTION_HISTORY_KEY);
  if (supabase) {
    supabase.from('claims').delete().neq('id', '0').then(({ error }) => {
      if (error) console.error("Supabase claims clear error:", error);
    });
    supabase.from('disruptions').delete().neq('id', '0').then(({ error }) => {
      if (error) console.error("Supabase disruptions clear error:", error);
    });
  }
}

export function getDisruptionLabel(type: string) {
  switch (type) {
    case "weather":
      return "Heavy Rain";
    case "platform_outage":
      return "Platform Outage";
    case "traffic":
      return "Traffic Gridlock";
    case "aqi":
      return "Poor AQI";
    default:
      return "Disruption";
  }
}

export function getDisruptionDescription(type: string, severity: number, demandLevel: number) {
  const severityText = `${Math.round(severity)}% severity`;
  const demandText = `${Math.round(demandLevel)}% demand left`;

  switch (type) {
    case "weather":
      return `Weather trigger reached ${severityText} with ${demandText}.`;
    case "platform_outage":
      return `Platform outage reached ${severityText} with ${demandText}.`;
    case "traffic":
      return `Traffic disruption reached ${severityText} with ${demandText}.`;
    case "aqi":
      return `AQI trigger reached ${severityText} with ${demandText}.`;
    default:
      return `Disruption reached ${severityText} with ${demandText}.`;
  }
}

export function getDisruptionSource(type: string) {
  switch (type) {
    case "weather":
      return "Weather API";
    case "platform_outage":
      return "Platform Status API";
    case "traffic":
      return "Traffic Maps API";
    case "aqi":
      return "AQI Sensor API";
    default:
      return "Disruption API";
  }
}

export function getDisruptionIcon(type: string) {
  switch (type) {
    case "weather":
      return Cloud;
    case "platform_outage":
      return Smartphone;
    case "traffic":
      return Car;
    case "aqi":
      return Wind;
    default:
      return AlertTriangle;
  }
}
