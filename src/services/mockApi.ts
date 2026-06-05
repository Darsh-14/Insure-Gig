import {
  calculateActuarialInputs,
  calculatePremiumActuarial,
  isPremiumModelReady,
  predictPremium,
  type ActivityTier,
  type PerilType,
  type PremiumProfile,
} from './mlEngine';

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function calculateMovementLinearity(path: Array<{ lat: number; lon: number }>) {
  if (path.length < 2) return 0;

  const start = path[0];
  const end = path[path.length - 1];
  const direct = getDistanceFromLatLonInKm(start.lat, start.lon, end.lat, end.lon);

  let traveled = 0;
  for (let i = 1; i < path.length; i += 1) {
    traveled += getDistanceFromLatLonInKm(path[i - 1].lat, path[i - 1].lon, path[i].lat, path[i].lon);
  }

  if (traveled <= 0.001) return 1;
  return Math.min(1, direct / traveled);
}

function mapPersonaToActivityTier(persona: string): ActivityTier {
  if (persona === 'hustler') return 'high';
  if (persona === 'fair_weather') return 'low';
  return 'medium';
}

function mapPersonaToPeril(persona: string): PerilType {
  if (persona === 'night_owl') return 'aqi';
  if (persona === 'hustler') return 'traffic';
  return 'weather';
}

function mapDisruptionToPeril(disruptionType: string): PerilType {
  if (disruptionType === 'aqi') return 'aqi';
  if (disruptionType === 'traffic') return 'traffic';
  if (disruptionType === 'platform_outage') return 'platform_outage';
  return 'weather';
}

function buildProfile(data: {
  dailyIncome: number;
  vehicle: string;
  zone: string;
  persona: string;
  age?: number;
  ratings?: number;
}): PremiumProfile {
  const zone = data.zone.toLowerCase();
  let city = 'Urban';
  if (
    zone.includes('mumbai') ||
    zone.includes('delhi') ||
    zone.includes('bangalore') ||
    zone.includes('bengaluru') ||
    zone.includes('chennai') ||
    zone.includes('hyderabad') ||
    zone.includes('kolkata') ||
    zone.includes('pune')
  ) {
    city = 'Metropolitian';
  } else if (
    zone.includes('surat') ||
    zone.includes('jaipur') ||
    zone.includes('lucknow') ||
    zone.includes('nagpur') ||
    zone.includes('indore')
  ) {
    city = 'Urban';
  } else {
    city = 'Semi-Urban';
  }

  const vehicleMap: Record<string, string> = {
    bike: 'motorcycle',
    motorcycle: 'motorcycle',
    scooter: 'scooter',
    electric_scooter: 'electric_scooter',
    cycle: 'bicycle',
    bicycle: 'bicycle',
  };
  const vehicle = vehicleMap[data.vehicle] ?? 'motorcycle';

  const isNightShift = data.persona === 'night_owl';
  const traffic = data.persona === 'hustler' ? 'High' : data.persona === 'night_owl' ? 'Medium' : 'Low';

  const experienceTier = data.dailyIncome > 700 ? 3 : data.dailyIncome > 550 ? 2 : data.dailyIncome > 400 ? 1 : 0;

  return {
    age: data.age ?? 28,
    ratings: data.ratings ?? 4.2,
    vehicleCondition: 2,
    multipleDeliveries: data.persona === 'hustler' ? 2 : 1,
    festival: false,
    isNightShift,
    distanceKm: 5,
    experienceTier,
    city,
    weather: data.persona === 'fair_weather' ? 'Sunny' : 'Cloudy',
    traffic,
    vehicle,
    timeOfDay: isNightShift ? 'Night' : 'Evening',
    dailyIncome: data.dailyIncome,
    perilType: mapPersonaToPeril(data.persona),
    activityTier: mapPersonaToActivityTier(data.persona),
  };
}

interface FraudTelemetry {
  platformLoginCoords?: { lat: number; lon: number };
  previousCoords?: { lat: number; lon: number };
  movementPath?: Array<{ lat: number; lon: number }>;
  minutesSinceLastPing?: number;
  gpsAccuracyMeters?: number;
  claimHistoryCount?: number;
  weatherSeverityAtGps?: number;
  weatherSeverityAtIp?: number;
  currentDisruptionSeverity?: number;
}

interface PortfolioMetrics {
  totalPremiumCollected: number;
  totalClaimsPaid: number;
  activePolicies: number;
  newEnrollmentsSuspended: boolean;
  bcr: number;
  lossRatio: number;
}

const portfolioMetrics: PortfolioMetrics = {
  totalPremiumCollected: 0,
  totalClaimsPaid: 0,
  activePolicies: 0,
  newEnrollmentsSuspended: false,
  bcr: 0,
  lossRatio: 0,
};

function recalculatePortfolioHealth() {
  const premium = Math.max(1, portfolioMetrics.totalPremiumCollected);
  portfolioMetrics.bcr = portfolioMetrics.totalClaimsPaid / premium;
  portfolioMetrics.lossRatio = portfolioMetrics.totalClaimsPaid / premium;
  portfolioMetrics.newEnrollmentsSuspended = portfolioMetrics.lossRatio > 0.85;
}

function thresholdByPeril(disruptionType: string): number {
  if (disruptionType === 'weather') return 70;
  if (disruptionType === 'aqi') return 65;
  if (disruptionType === 'traffic') return 75;
  if (disruptionType === 'platform_outage') return 55;
  return 70;
}

export const mockApi = {
  calculatePremium: async (data: {
    dailyIncome: number;
    vehicle: string;
    zone: string;
    persona: string;
    age?: number;
    ratings?: number;
  }): Promise<number> => {
    const profile = buildProfile(data);

    if (isPremiumModelReady()) {
      try {
        const mlPremium = await predictPremium(profile);
        portfolioMetrics.totalPremiumCollected += mlPremium;
        portfolioMetrics.activePolicies += 1;
        recalculatePortfolioHealth();
        return mlPremium;
      } catch (e) {
        console.warn('[InsureGig] ML prediction failed, falling back to actuarial premium:', e);
      }
    }

    const fallback = calculatePremiumActuarial(profile);
    portfolioMetrics.totalPremiumCollected += fallback;
    portfolioMetrics.activePolicies += 1;
    recalculatePortfolioHealth();
    return fallback;
  },

  calculatePremiumBreakdown: (data: {
    dailyIncome: number;
    vehicle: string;
    zone: string;
    persona: string;
    age?: number;
    ratings?: number;
  }) => {
    const profile = buildProfile(data);
    const premium = calculatePremiumActuarial(profile);
    const inputs = calculateActuarialInputs(profile);
    return { premium, inputs };
  },

  checkFraud: (
    gpsCoords: { lat: number; lon: number },
    ipCoords: { lat: number; lon: number },
    telemetry?: FraudTelemetry,
  ) => {
    const reasons: string[] = [];
    let riskScore = 0;

    const gpsIpDistance = getDistanceFromLatLonInKm(gpsCoords.lat, gpsCoords.lon, ipCoords.lat, ipCoords.lon);
    if (gpsIpDistance > 50) {
      riskScore += 60;
      reasons.push('GPS and IP location mismatch exceeds 50km threshold.');
    }

    const loginDistance = telemetry?.platformLoginCoords
      ? getDistanceFromLatLonInKm(
          gpsCoords.lat,
          gpsCoords.lon,
          telemetry.platformLoginCoords.lat,
          telemetry.platformLoginCoords.lon,
        )
      : 0;

    if (telemetry?.platformLoginCoords && loginDistance > 25) {
      riskScore += 20;
      reasons.push('GPS and platform login location mismatch exceeds 25km.');
    }

    if (telemetry?.previousCoords && telemetry?.minutesSinceLastPing && telemetry.minutesSinceLastPing > 0) {
      const travelDistance = getDistanceFromLatLonInKm(
        telemetry.previousCoords.lat,
        telemetry.previousCoords.lon,
        gpsCoords.lat,
        gpsCoords.lon,
      );
      const speedKmh = travelDistance / (telemetry.minutesSinceLastPing / 60);
      if (speedKmh > 150) {
        riskScore += 20;
        reasons.push('Teleport pattern detected from impossible travel speed.');
      }
    }

    if (telemetry?.gpsAccuracyMeters && (telemetry.gpsAccuracyMeters < 4 || telemetry.gpsAccuracyMeters > 150)) {
      riskScore += 10;
      reasons.push('Suspicious GPS accuracy fingerprint.');
    }

    if ((telemetry?.claimHistoryCount ?? 0) >= 3) {
      riskScore += 10;
      reasons.push('Frequent recent claims require caution.');
    }

    if (telemetry?.movementPath && telemetry.movementPath.length >= 4) {
      const linearity = calculateMovementLinearity(telemetry.movementPath);
      if (linearity >= 0.95) {
        riskScore += 12;
        reasons.push('Movement path appears unnaturally linear, consistent with scripted GPS traces.');
      }
    }

    if (
      telemetry?.weatherSeverityAtGps !== undefined &&
      telemetry?.weatherSeverityAtIp !== undefined &&
      telemetry?.currentDisruptionSeverity !== undefined
    ) {
      const weatherGap = Math.abs(telemetry.weatherSeverityAtGps - telemetry.weatherSeverityAtIp);
      const triggerGap = Math.abs(telemetry.currentDisruptionSeverity - telemetry.weatherSeverityAtGps);
      if (weatherGap >= 35 && triggerGap >= 25) {
        riskScore += 18;
        reasons.push('Weather contradiction detected between claimed GPS zone and verified IP zone.');
      }
    }

    return {
      isValid: riskScore < 50,
      riskScore,
      distance: Math.round(gpsIpDistance * 10) / 10,
      checks: {
        gpsVsIpKm: Math.round(gpsIpDistance * 10) / 10,
        gpsVsLoginKm: Math.round(loginDistance * 10) / 10,
        pathLinearity:
          telemetry?.movementPath && telemetry.movementPath.length >= 4
            ? Number(calculateMovementLinearity(telemetry.movementPath).toFixed(3))
            : null,
        weatherSeverityGap:
          telemetry?.weatherSeverityAtGps !== undefined && telemetry?.weatherSeverityAtIp !== undefined
            ? Math.round(Math.abs(telemetry.weatherSeverityAtGps - telemetry.weatherSeverityAtIp))
            : null,
      },
      reasons,
    };
  },

  processClaim: (
    worker: { dailyIncome: number; premiumPaid: number; platform: string },
    event: { disruptionType: string; severity: number; demandLevel: number },
  ) => {
    const hourlyIncome = worker.dailyIncome / 10;
    const hoursLost = Math.max(1, Math.round(event.severity * 5));

    const expectedIncomeWithoutDisruption = Math.round(hoursLost * hourlyIncome * 1.5);
    const actualIncomeWithDisruption = Math.round(expectedIncomeWithoutDisruption * event.demandLevel);
    const expectedLoss = expectedIncomeWithoutDisruption - actualIncomeWithDisruption;

    const maxPayout = worker.premiumPaid * 15;
    const payout = Math.min(expectedLoss, maxPayout);

    const dropPercentage = Math.round((1 - event.demandLevel) * 100);

    let disruptionText = '';
    if (event.disruptionType === 'weather')
      disruptionText = `the high weather severity (${Math.round(event.severity * 100)}%)`;
    else if (event.disruptionType === 'platform_outage')
      disruptionText = `a massive ${worker.platform} server outage (${Math.round(event.severity * 100)}% offline)`;
    else if (event.disruptionType === 'traffic')
      disruptionText = `severe traffic gridlock / road closures (${Math.round(event.severity * 100)}% severity)`;
    else if (event.disruptionType === 'aqi')
      disruptionText = `hazardous air quality (${Math.round(event.severity * 100)}% AQI severity)`;
    else disruptionText = `a severe disruption event (${Math.round(event.severity * 100)}% severity)`;

    return {
      hoursLost,
      expectedIncomeWithoutDisruption,
      actualIncomeWithDisruption,
      expectedLoss,
      payout,
      approved: true,
      disruptionType: event.disruptionType,
      explanation: `Counterfactual analysis complete: Without disruption, expected income was ₹${expectedIncomeWithoutDisruption} over ${hoursLost} peak hours. Due to ${disruptionText}, demand dropped ${dropPercentage}%, reducing earnings to ₹${actualIncomeWithDisruption}. Verified loss is ₹${expectedLoss}; parametric payout released instantly: ₹${payout}.`,
    };
  },

  processClaimWithModel: async (
    worker: { dailyIncome: number; premiumPaid: number; platform: string },
    event: { disruptionType: string; severity: number; demandLevel: number },
  ) => {
    const fallback = mockApi.processClaim(worker, event);

    if (!isPremiumModelReady()) {
      return {
        ...fallback,
        modelUsed: 'actuarial_fallback',
      };
    }

    try {
      const claimProfile: PremiumProfile = {
        age: 30,
        ratings: 4.3,
        vehicleCondition: 2,
        multipleDeliveries: event.demandLevel < 0.5 ? 2 : 1,
        festival: false,
        isNightShift: false,
        distanceKm: 6,
        experienceTier: worker.dailyIncome > 700 ? 3 : worker.dailyIncome > 550 ? 2 : 1,
        city: 'Metropolitian',
        weather: event.disruptionType === 'weather' ? 'Stormy' : event.disruptionType === 'aqi' ? 'Fog' : 'Cloudy',
        traffic: event.disruptionType === 'traffic' ? 'Jam' : 'Medium',
        vehicle: 'motorcycle',
        timeOfDay: 'Evening',
        dailyIncome: worker.dailyIncome,
        perilType: mapDisruptionToPeril(event.disruptionType),
        activityTier: event.demandLevel < 0.5 ? 'high' : 'medium',
      };

      const predictedPremium = await predictPremium(claimProfile);
      const riskWeight = Math.min(1, Math.max(0, (predictedPremium - 20) / 30));
      const severityWeight = Math.min(1, Math.max(0, event.severity));
      const demandDrop = Math.min(1, Math.max(0, 1 - event.demandLevel));

      const expectedLoss = fallback.expectedLoss;
      const maxPayout = worker.premiumPaid * 15;
      const modelLossFactor = Math.min(1, Math.max(0.25, 0.35 + 0.35 * riskWeight + 0.2 * severityWeight + 0.1 * demandDrop));
      const modeledLoss = Math.round(expectedLoss * modelLossFactor);
      const payout = Math.min(modeledLoss, maxPayout);

      return {
        ...fallback,
        payout,
        modelUsed: 'premium_model',
        explanation: `${fallback.explanation} Payout calibrated using pretrained premium model risk signal (predicted weekly premium: ₹${predictedPremium}).`,
      };
    } catch (err) {
      console.warn('[InsureGig] Premium model payout inference failed, using fallback payout.', err);
      return {
        ...fallback,
        modelUsed: 'actuarial_fallback',
      };
    }
  },

  runParametricClaimFlow: async (input: {
    worker: { dailyIncome: number; premiumPaid: number; platform: string; policyActive?: boolean };
    event: { disruptionType: string; severity: number; demandLevel: number };
    gpsCoords: { lat: number; lon: number };
    ipCoords: { lat: number; lon: number };
    telemetry?: FraudTelemetry;
  }) => {
    const threshold = thresholdByPeril(input.event.disruptionType);
    const triggerFired = input.event.severity * 100 >= threshold;

    if (!triggerFired) {
      return {
        stage: 'trigger_not_fired',
        approved: false,
        reason: `Trigger did not fire: ${Math.round(input.event.severity * 100)}% < ${threshold}% threshold.`,
      };
    }

    if (!input.worker.policyActive && input.worker.policyActive !== undefined) {
      return {
        stage: 'policy_inactive',
        approved: false,
        reason: 'Policy check failed: worker does not have active weekly cover.',
      };
    }

    const fraud = mockApi.checkFraud(input.gpsCoords, input.ipCoords, input.telemetry);
    if (!fraud.isValid) {
      return {
        stage: 'fraud_failed',
        approved: false,
        reason: 'Fraud verification failed.',
        fraud,
      };
    }

    const claim = await mockApi.processClaimWithModel(input.worker, input.event);
    portfolioMetrics.totalClaimsPaid += claim.payout;
    recalculatePortfolioHealth();

    return {
      stage: 'payout_released',
      approved: true,
      trigger: {
        fired: true,
        threshold,
        severity: Math.round(input.event.severity * 100),
      },
      policy: {
        active: true,
        weeklyPremium: input.worker.premiumPaid,
      },
      fraud,
      claim,
      actuarial: {
        bcr: Number(portfolioMetrics.bcr.toFixed(3)),
        lossRatio: Number(portfolioMetrics.lossRatio.toFixed(3)),
        targetBcrMin: 0.55,
        targetBcrMax: 0.7,
        enrollmentsSuspended: portfolioMetrics.newEnrollmentsSuspended,
      },
    };
  },

  getActuarialMetrics: () => ({ ...portfolioMetrics }),

  runMonsoonStressTest: (days = 14, workers = 500) => {
    let simPremium = 0;
    let simClaims = 0;

    for (let d = 0; d < days; d++) {
      for (let w = 0; w < workers; w++) {
        const premium = 20 + Math.random() * 30;
        simPremium += premium;

        const severeMonsoon = Math.random() < 0.35;
        if (!severeMonsoon) continue;

        const claim = premium * (4 + Math.random() * 8);
        simClaims += claim;
      }
    }

    const bcr = simClaims / Math.max(1, simPremium);
    const lossRatio = bcr;

    return {
      scenario: `${days}-day monsoon stress`,
      workers,
      simulatedPremium: Math.round(simPremium),
      simulatedClaims: Math.round(simClaims),
      bcr: Number(bcr.toFixed(3)),
      lossRatio: Number(lossRatio.toFixed(3)),
      withinTargetBcr: bcr >= 0.55 && bcr <= 0.7,
      suspendEnrollments: lossRatio > 0.85,
    };
  },
};
