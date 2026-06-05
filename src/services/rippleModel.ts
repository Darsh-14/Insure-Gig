import * as tf from '@tensorflow/tfjs';

// Define the interface for the AI model output
export interface DisruptionPrediction {
  weather: number;
  aqi: number;
  traffic: number;
  platform: number;
  isHighRisk: boolean;
  primaryRisk: string;
}

// Variables to cache the model so we don't fetch it every render
let aiModel: tf.LayersModel | null = null;
let aiMeta: any = null;
let isLoading = false;

/**
 * Initializes and loads the TensorFlow model from the `/public` directory into browser memory.
 */
export async function initializeRippleModel() {
  if (aiModel || isLoading) return;
  isLoading = true;

  try {
    console.log("[AI] Loading Ripple Disruption Model into WebGL...");
    const performanceStart = performance.now();

    // 1. Load Metadata properties (Normalization limits, Thresholds)
    const metaResponse = await fetch('/disruption_model/model_meta.json');
    aiMeta = await metaResponse.json();

    // 2. Load Keras Layers parameters and construct the Tensor architecture
    aiModel = await tf.loadLayersModel('/disruption_model/model.json');

    const performanceEnd = performance.now();
    console.log(`[AI] Model loaded successfully in ${(performanceEnd - performanceStart).toFixed(2)}ms!`);
  } catch (error) {
    console.error("[AI] Error loading Ripple Model:", error);
  } finally {
    isLoading = false;
  }
}

/**
 * Generates structured 16-Feature Tensor based on Geospatial input.
 * Calculates predictive outcomes using the trained AI weights.
 */
export async function predictRippleForLocation(lat: number, lng: number): Promise<DisruptionPrediction | null> {
  if (!aiModel || !aiMeta) {
    console.warn("[AI] Model not initialized yet. Calling initialize()...");
    await initializeRippleModel();
    if (!aiModel) return null;
  }

  // Generate temporal metadata (Current Month, Day of Week, cyclical sine waves)
  const now = new Date();
  const month = now.getMonth() + 1;
  const dow = now.getDay();
  
  // Feature Normalization according to model_meta definitions
  const month_sin = Math.sin((2 * Math.PI * month) / 12);
  const month_cos = Math.cos((2 * Math.PI * month) / 12);
  const dow_sin = Math.sin((2 * Math.PI * dow) / 7);
  const dow_cos = Math.cos((2 * Math.PI * dow) / 7);
  
  const is_monsoon = (month >= 6 && month <= 9) ? 1.0 : 0.0;
  const is_winter_fog = (month >= 11 || month <= 2) ? 1.0 : 0.0;
  
  const lat_norm = Math.max(0, Math.min(1, (lat - aiMeta.normalization.lat_range[0]) / (aiMeta.normalization.lat_range[1] - aiMeta.normalization.lat_range[0])));
  const lon_norm = Math.max(0, Math.min(1, (lng - aiMeta.normalization.lon_range[0]) / (aiMeta.normalization.lon_range[1] - aiMeta.normalization.lon_range[0])));

  // Mocking current live environmental API values relative to normalization maximums
  // Since we are building an MVP Map prototype, we inject generic baseline parameters here
  const aqi_norm = 90 / aiMeta.normalization.aqi_max;
  const rain_norm = 15 / aiMeta.normalization.rainfall_max;
  const aqi_lags = [0.15, 0.14, 0.15]; 
  const rain_lags = [0.05, 0.01, 0.05];

  // 16 Feature Input strictly enforcing the architectural schema
  const featureArray = [
    month_sin, month_cos, dow_sin, dow_cos,
    is_monsoon, is_winter_fog, 
    lat_norm, lon_norm,
    aqi_norm, aqi_lags[0], aqi_lags[1], aqi_lags[2],
    rain_norm, rain_lags[0], rain_lags[1], rain_lags[2]
  ];

  // Create WebGL Float32 Tensor of shape [1, 16]
  const tensorInput = tf.tensor2d([featureArray], [1, 16]);

  const pStart = performance.now();
  // INFERENCE
  const predictionTensor = aiModel.predict(tensorInput) as tf.Tensor;
  const data = await predictionTensor.array() as number[][];
  const pEnd = performance.now();

  console.log(`[AI] Extracted Geo-Inference in ${(pEnd - pStart).toFixed(2)}ms`);

  // Dispose unmanaged memory forcefully to prevent WebGL Leak
  tf.dispose([tensorInput, predictionTensor]);

  const scores = data[0]; // [weather, aqi, traffic, platform]
  
  const predictions = {
    weather: scores[0],
    aqi: scores[1],
    traffic: scores[2],
    platform: scores[3],
  };

  // Check if any output breaches the meta thresholds
  let isHighRisk = false;
  let highestRiskVal = 0;
  let primaryRisk = "Normal Conditions";

  const labels = ["weather", "aqi", "traffic", "platform"];
  Object.keys(predictions).forEach((key, index) => {
    const val = scores[index];
    const threshold = aiMeta.thresholds[`${key}_trigger`];
    if (val > threshold && val > highestRiskVal) {
      isHighRisk = true;
      highestRiskVal = val;
      primaryRisk = key;
    }
  });

  return { ...predictions, isHighRisk, primaryRisk };
}
