import * as tf from '@tensorflow/tfjs';

let insuranceModel: tf.LayersModel | null = null;
let isTraining = false;

let premiumModel: tf.LayersModel | null = null;
let premiumModelLoading = false;

let disruptionModel: tf.LayersModel | null = null;
let disruptionModelLoading = false;

const CITY_ENC: Record<string, number> = { Metropolitian: 1.0, Urban: 0.5, 'Semi-Urban': 0.0 };
const WEATHER_ENC: Record<string, number> = { Sunny: 0.0, Cloudy: 0.17, Windy: 0.33, Fog: 0.5, Sandstorms: 0.67, Stormy: 1.0 };
const TRAFFIC_ENC: Record<string, number> = { Low: 0.0, Medium: 0.33, High: 0.67, Jam: 1.0 };
const VEHICLE_ENC: Record<string, number> = { electric_scooter: 0.0, bicycle: 0.33, scooter: 0.67, motorcycle: 1.0 };
const TOD_ENC: Record<string, number> = { Morning: 0.0, Afternoon: 0.33, Evening: 0.67, Night: 1.0 };

const CITY_INCOME: Record<string, number> = { Metropolitian: 700, Urban: 550, 'Semi-Urban': 420 };

export type PerilType = 'weather' | 'aqi' | 'traffic' | 'platform_outage';
export type ActivityTier = 'low' | 'medium' | 'high';

export interface PremiumProfile {
  age: number;
  ratings: number;
  vehicleCondition: number;
  multipleDeliveries: number;
  festival: boolean;
  isNightShift: boolean;
  distanceKm: number;
  experienceTier: number;
  city: string;
  weather: string;
  traffic: string;
  vehicle: string;
  timeOfDay: string;
  dailyIncome?: number;
  perilType?: PerilType;
  activityTier?: ActivityTier;
  triggerProbability?: number;
  daysExposed?: number;
}

export interface PremiumInputs {
  triggerProbability: number;
  avgIncomeLostPerDay: number;
  daysExposed: number;
  cityFactor: number;
  perilFactor: number;
  activityFactor: number;
  basePremium: number;
  adjustedPremium: number;
}

const WEEKLY_MIN = 20;
const WEEKLY_MAX = 50;

const CITY_TRIGGER_BASE: Record<string, number> = {
  Metropolitian: 0.2,
  Urban: 0.15,
  'Semi-Urban': 0.11,
};

const CITY_FACTOR: Record<string, number> = {
  Metropolitian: 1.12,
  Urban: 1.0,
  'Semi-Urban': 0.9,
};

const PERIL_TRIGGER_FACTOR: Record<PerilType, number> = {
  weather: 1.2,
  aqi: 1.12,
  traffic: 1.08,
  platform_outage: 0.95,
};

const PERIL_LOSS_FRACTION: Record<PerilType, number> = {
  weather: 0.24,
  aqi: 0.2,
  traffic: 0.16,
  platform_outage: 0.26,
};

const PERIL_FACTOR: Record<PerilType, number> = {
  weather: 1.15,
  aqi: 1.08,
  traffic: 1.03,
  platform_outage: 1.0,
};

const PERIL_EXPOSURE_DAYS: Record<PerilType, number> = {
  weather: 3,
  aqi: 2,
  traffic: 2,
  platform_outage: 1,
};

const ACTIVITY_TRIGGER_FACTOR: Record<ActivityTier, number> = {
  low: 0.9,
  medium: 1.0,
  high: 1.12,
};

const ACTIVITY_FACTOR: Record<ActivityTier, number> = {
  low: 0.9,
  medium: 1.0,
  high: 1.14,
};

const ACTIVITY_LOSS_FACTOR: Record<ActivityTier, number> = {
  low: 0.85,
  medium: 1.0,
  high: 1.12,
};

function derivePerilType(profile: PremiumProfile): PerilType {
  if (profile.perilType) return profile.perilType;

  if (profile.weather === 'Stormy' || profile.weather === 'Sandstorms') return 'weather';
  if (profile.weather === 'Fog') return 'aqi';
  if (profile.traffic === 'Jam' || profile.traffic === 'High') return 'traffic';
  return 'platform_outage';
}

function deriveActivityTier(profile: PremiumProfile): ActivityTier {
  if (profile.activityTier) return profile.activityTier;

  if (profile.multipleDeliveries >= 2 || profile.isNightShift) return 'high';
  if (profile.multipleDeliveries <= 0) return 'low';
  return 'medium';
}

function deriveDailyIncome(profile: PremiumProfile): number {
  if (profile.dailyIncome && Number.isFinite(profile.dailyIncome)) {
    return Math.min(1200, Math.max(200, profile.dailyIncome));
  }

  return Math.max(
    200,
    Math.min(
      1200,
      (CITY_INCOME[profile.city] ?? 500) +
        profile.multipleDeliveries * 80 +
        (profile.festival ? 150 : 0) +
        (profile.isNightShift ? 80 : 0) -
        (2 - profile.vehicleCondition) * 30,
    ),
  );
}

export function calculateActuarialInputs(profile: PremiumProfile): PremiumInputs {
  const perilType = derivePerilType(profile);
  const activityTier = deriveActivityTier(profile);
  const dailyIncome = deriveDailyIncome(profile);

  const cityTrigger = CITY_TRIGGER_BASE[profile.city] ?? 0.14;
  const perilTrigger = PERIL_TRIGGER_FACTOR[perilType] ?? 1.0;
  const activityTrigger = ACTIVITY_TRIGGER_FACTOR[activityTier] ?? 1.0;

  const triggerProbability = Math.min(
    0.45,
    Math.max(0.05, profile.triggerProbability ?? cityTrigger * perilTrigger * activityTrigger),
  );

  const avgIncomeLostPerDay =
    dailyIncome * (PERIL_LOSS_FRACTION[perilType] ?? 0.2) * (ACTIVITY_LOSS_FACTOR[activityTier] ?? 1.0);

  const daysExposed = Math.min(
    7,
    Math.max(1, Math.round(profile.daysExposed ?? PERIL_EXPOSURE_DAYS[perilType] ?? 2)),
  );

  const cityFactor = CITY_FACTOR[profile.city] ?? 1.0;
  const perilFactor = PERIL_FACTOR[perilType] ?? 1.0;
  const activityFactor = ACTIVITY_FACTOR[activityTier] ?? 1.0;

  const basePremium = triggerProbability * avgIncomeLostPerDay * daysExposed;
  const adjustedPremium = basePremium * cityFactor * perilFactor * activityFactor;

  return {
    triggerProbability,
    avgIncomeLostPerDay,
    daysExposed,
    cityFactor,
    perilFactor,
    activityFactor,
    basePremium,
    adjustedPremium,
  };
}

export async function loadPremiumModel(): Promise<boolean> {
  if (premiumModel) return true;
  if (premiumModelLoading) return false;
  premiumModelLoading = true;

  try {
    premiumModel = await tf.loadLayersModel('/premium_model/model.json');
    console.log('[InsureGig] Premium model loaded from public/premium_model.');
    premiumModelLoading = false;
    return true;
  } catch (err) {
    console.warn('[InsureGig] Premium model missing; using actuarial fallback.', err);
    premiumModelLoading = false;
    return false;
  }
}

export function isPremiumModelReady(): boolean {
  return premiumModel !== null;
}

function buildFeatureVector(profile: PremiumProfile): number[] {
  const dailyIncome = deriveDailyIncome(profile);

  return [
    (Math.min(Math.max(profile.age, 15), 60) - 15) / 45.0,
    (Math.min(Math.max(profile.ratings, 1), 5) - 1.0) / 4.0,
    Math.min(profile.vehicleCondition, 3) / 3.0,
    Math.min(profile.multipleDeliveries, 3) / 3.0,
    profile.festival ? 1.0 : 0.0,
    profile.isNightShift ? 1.0 : 0.0,
    Math.min(profile.distanceKm, 30) / 30.0,
    Math.min(profile.experienceTier, 3) / 3.0,
    CITY_ENC[profile.city] ?? 0.5,
    WEATHER_ENC[profile.weather] ?? 0.33,
    TRAFFIC_ENC[profile.traffic] ?? 0.33,
    VEHICLE_ENC[profile.vehicle] ?? 0.5,
    TOD_ENC[profile.timeOfDay] ?? 0.33,
    dailyIncome / 1200.0,
  ];
}

export async function predictPremium(profile: PremiumProfile): Promise<number> {
  if (!premiumModel) {
    throw new Error('Premium model not loaded. Call loadPremiumModel() first.');
  }

  const features = buildFeatureVector(profile);
  const inputTensor = tf.tensor2d([features]);
  const output = premiumModel.predict(inputTensor) as tf.Tensor;
  const result = await output.data();

  inputTensor.dispose();
  output.dispose();

  const raw = result[0];

  // If model outputs above target range it means it was trained on old targets
  // and needs retraining. Throw so caller falls back to actuarial.
  if (raw > WEEKLY_MAX) {
    throw new Error(
      `Premium model output ₹${Math.round(raw)} exceeds target range — retrain required.`,
    );
  }

  return Math.min(WEEKLY_MAX, Math.max(WEEKLY_MIN, Math.round(raw)));
}

export function calculatePremiumActuarial(profile: PremiumProfile): number {
  const inputs = calculateActuarialInputs(profile);
  // Normalize raw formula output into [WEEKLY_MIN, WEEKLY_MAX] so risk
  // differences produce visible variation rather than all hitting the cap.
  // RAW_FLOOR/CEIL calibrated against the formula's realistic output range.
  const RAW_FLOOR = 3;
  const RAW_CEIL = 80;
  const clamped = Math.min(RAW_CEIL, Math.max(RAW_FLOOR, inputs.adjustedPremium));
  const normalized =
    WEEKLY_MIN + ((clamped - RAW_FLOOR) / (RAW_CEIL - RAW_FLOOR)) * (WEEKLY_MAX - WEEKLY_MIN);
  return Math.round(normalized);
}

export function generateTrainingData(samples = 3000) {
  const xs: number[][] = [];
  const ys: number[][] = [];

  for (let i = 0; i < samples; i++) {
    const severity = Math.random();
    const demand = Math.random();
    let baseLoss = severity * 0.6 + (1 - demand) * 0.4;
    baseLoss += Math.random() * 0.3 - 0.15;
    xs.push([severity, demand]);
    ys.push([Math.max(0, Math.min(1, baseLoss))]);
  }

  return { inputs: tf.tensor2d(xs), labels: tf.tensor2d(ys) };
}

export async function trainInsuranceModel(onProgress?: (epoch: number, loss: number) => void) {
  if (isTraining) return false;
  isTraining = true;

  const { inputs, labels } = generateTrainingData(3000);
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(0.02), loss: 'meanSquaredError' });

  await model.fit(inputs, labels, {
    epochs: 50,
    batchSize: 128,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onProgress && logs) onProgress(epoch + 1, logs.loss);
      },
    },
  });

  insuranceModel = model;
  isTraining = false;
  inputs.dispose();
  labels.dispose();
  return true;
}

export function isModelReady() {
  return insuranceModel !== null;
}

export async function predictDisruptionLoss(severityScore: number, demandPercentage: number) {
  if (!insuranceModel) {
    throw new Error('Disruption model not trained yet.');
  }

  const inputTensor = tf.tensor2d([[severityScore / 100.0, demandPercentage / 100.0]]);
  const prediction = insuranceModel.predict(inputTensor) as tf.Tensor;
  const result = await prediction.data();

  inputTensor.dispose();
  prediction.dispose();
  return result[0];
}

// ── Disruption Prediction Model ────────────────────────────────────────────────
// Trained on AQI + rainfall datasets via DisruptionModel_Colab.ipynb
// Predicts 4 disruption severity scores [weather, aqi, traffic, platform] ∈ [0, 1]

export interface DisruptionForecast {
  weather: number;
  aqi: number;
  traffic: number;
  platform: number;
  overallRisk: number;
  source: 'model' | 'actuarial';
}

const CITY_COORDS_ENC: Record<string, [number, number]> = {
  Mumbai:    [19.0760, 72.8777],
  Delhi:     [28.6139, 77.2090],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.3850, 78.4867],
  Chennai:   [13.0827, 80.2707],
  Kolkata:   [22.5726, 88.3639],
  Pune:      [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
};

const METRO_TRAFFIC_BASE: Record<string, number> = {
  Mumbai: 0.78, Delhi: 0.75, Bangalore: 0.70,
  Hyderabad: 0.55, Chennai: 0.60, Kolkata: 0.65,
  Pune: 0.50, Ahmedabad: 0.45,
};

export async function loadDisruptionModel(): Promise<boolean> {
  if (disruptionModel) return true;
  if (disruptionModelLoading) return false;
  disruptionModelLoading = true;

  try {
    disruptionModel = await tf.loadLayersModel('/disruption_model/model.json');
    console.log('[InsureGig] Disruption model loaded from public/disruption_model.');
    disruptionModelLoading = false;
    return true;
  } catch {
    console.warn('[InsureGig] Disruption model not found; actuarial fallback active.');
    disruptionModelLoading = false;
    return false;
  }
}

export function isDisruptionModelReady(): boolean {
  return disruptionModel !== null;
}

function buildDisruptionFeatureVector(
  city: string,
  date: Date,
  liveAqi: number,
  liveRainfallMm: number,
): number[] {
  const month = date.getMonth() + 1;
  const dow   = date.getDay();

  const monthSin = Math.sin(2 * Math.PI * month / 12);
  const monthCos = Math.cos(2 * Math.PI * month / 12);
  const dowSin   = Math.sin(2 * Math.PI * dow   / 7);
  const dowCos   = Math.cos(2 * Math.PI * dow   / 7);

  const isMonsoon   = [6, 7, 8, 9].includes(month) ? 1.0 : 0.0;
  const isWinterFog = [11, 12, 1, 2].includes(month) ? 1.0 : 0.0;

  const coords = CITY_COORDS_ENC[city] ?? [20.0, 78.0];
  const latNorm = (coords[0] - 8.0)  / (37.0 - 8.0);
  const lonNorm = (coords[1] - 68.0) / (97.5 - 68.0);

  const aqiNorm  = Math.min(1.0, liveAqi / 500.0);
  const rainNorm = Math.min(1.0, liveRainfallMm / 200.0);

  // Without historical lags available at runtime, use current value as proxy
  return [
    monthSin, monthCos,
    dowSin,   dowCos,
    isMonsoon, isWinterFog,
    latNorm,   lonNorm,
    aqiNorm,              // aqi_norm
    aqiNorm * 0.9,        // aqi_lag1_norm  (slight decay)
    aqiNorm * 0.75,       // aqi_lag7_norm
    aqiNorm * 0.85,       // aqi_roll7_norm
    rainNorm,             // rain_norm
    rainNorm * 0.8,       // rain_lag1_norm
    rainNorm * 0.5,       // rain_lag7_norm
    rainNorm * 0.7,       // rain_roll7_norm
  ];
}

/** Actuarial fallback used when the trained model is unavailable */
function actuarialDisruptionForecast(
  city: string,
  date: Date,
  liveAqi: number,
  liveRainfallMm: number,
): DisruptionForecast {
  const month = date.getMonth() + 1;
  const isMonsoon = [6, 7, 8, 9].includes(month);

  const weather  = Math.min(1.0, (liveRainfallMm - 10) / 150.0);
  const aqi      = Math.min(1.0, Math.max(0, (liveAqi - 100) / 300.0));
  const trafficBase = METRO_TRAFFIC_BASE[city] ?? 0.55;
  const traffic  = Math.min(1.0, trafficBase * (1 + (liveRainfallMm > 30 ? 0.3 : 0)));
  const platform = isMonsoon ? 0.12 : 0.06;

  const overallRisk = Math.round(
    Math.min(100, Math.max(5,
      weather  * 0.35 * 100 +
      aqi      * 0.30 * 100 +
      traffic  * 0.25 * 100 +
      platform * 0.10 * 100
    ))
  );

  return {
    weather:  Math.max(0, parseFloat(weather.toFixed(3))),
    aqi:      Math.max(0, parseFloat(aqi.toFixed(3))),
    traffic:  parseFloat(traffic.toFixed(3)),
    platform: parseFloat(platform.toFixed(3)),
    overallRisk,
    source: 'actuarial',
  };
}

export async function predictDisruption(
  city: string,
  date: Date = new Date(),
  liveAqi: number = 120,
  liveRainfallMm: number = 0,
): Promise<DisruptionForecast> {
  if (!disruptionModel) {
    return actuarialDisruptionForecast(city, date, liveAqi, liveRainfallMm);
  }

  try {
    const features = buildDisruptionFeatureVector(city, date, liveAqi, liveRainfallMm);
    const inputTensor = tf.tensor2d([features]);
    const output = disruptionModel.predict(inputTensor) as tf.Tensor;
    const result = await output.data();
    inputTensor.dispose();
    output.dispose();

    const [weather, aqi, traffic, platform] = Array.from(result);
    const overallRisk = Math.round(
      Math.min(100, Math.max(5,
        weather  * 0.35 * 100 +
        aqi      * 0.30 * 100 +
        traffic  * 0.25 * 100 +
        platform * 0.10 * 100
      ))
    );

    return {
      weather:  parseFloat(weather.toFixed(3)),
      aqi:      parseFloat(aqi.toFixed(3)),
      traffic:  parseFloat(traffic.toFixed(3)),
      platform: parseFloat(platform.toFixed(3)),
      overallRisk,
      source: 'model',
    };
  } catch {
    return actuarialDisruptionForecast(city, date, liveAqi, liveRainfallMm);
  }
}
