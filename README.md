# 🛡️ InsureGig - AI-Powered Insurance for India's Gig Economy

> *trigger-based weekly insurance, Powered by AI*

🚀 **Live Demo:** [https://gig-inc-three.vercel.app](https://gig-inc-three.vercel.app) 
   **Pitch Deck:** [https://drive.google.com/drive/folders/1ywwNL-8XlBysUmgBd6f2lSF2xdSGzBwR](https://drive.google.com/drive/folders/1ywwNL-8XlBysUmgBd6f2lSF2xdSGzBwR)

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Current App Flow](#current-app-flow)
3. [Implemented Features](#implemented-features)
4. [System Architecture](#system-architecture)
5. [Persona-Based Scenarios & Workflow](#persona-based-scenarios--workflow)
6. [Weekly Premium Model & Parametric Triggers](#weekly-premium-model--parametric-triggers)
7. [Platform Choice: Web vs. Mobile](#platform-choice-web-vs-mobile)
8. [AI/ML Integration](#aiml-integration)
9. [Tech Stack](#tech-stack)
10. [Development Plan](#development-plan)
11. [Additional Considerations](#additional-considerations)
12. [How to Run the Demo](#how-to-run-the-demo)
13. [Team & Contact](#team--contact)

---

## 📌 Project Overview

**InsureGig** is a micro-insurance platform designed specifically for **delivery partners and gig workers**. Unlike traditional insurance, this platform uses a **parametric model** — meaning claims are triggered automatically based on measurable, predefined conditions (like severe weather or server crashes), with zero paperwork and no lengthy claim process.

### Problem Statement

> *To protect gig workers' livelihoods from uncontrollable external disruptions (extreme weather, platform server outages, traffic gridlock, or hazardous AQI) that cause an immediate, unpredictable loss of their daily wages.*

### Solution

> *We offer a week premium plan where payouts are automatically triggered when specific parametric events occur (e.g., severe rainfall thresholds are crossed or API servers crash). The entire experience — from enrolment, live risk-assessment, to the instant automatic payout — happens directly via our Web App.*

---

## 🔄 Current App Flow

- User signs up on the auth page and gets a calculated weekly premium.
- The user must complete the demo Razorpay payment step before dashboard access is allowed.
- After payment success, the dashboard, claims, plans, AI risk, history, and live map pages unlock.
- Claims can trigger payout simulation with fraud checks and optional SMS alerts.

---

## ✅ Implemented Features

- Weekly premium pricing using ML model (TensorFlow.js) or actuarial fallback, constrained to ₹20–₹50/week.
- Demo Razorpay payment gate before dashboard access (supports UPI, card, netbanking, wallet).
- Dashboard with policy snapshot, claims feed, income protection chart, and coverage summary.
- GPS spoof detection using GPS vs IP distance, platform-login location, movement speed, GPS accuracy fingerprinting, claim frequency, and weather mismatch checks.
- Live weather integration using OpenWeatherMap API with real-time risk scoring.
- SMS payout notification flow through a separate Twilio SMS gateway (Cloudflare Worker or local Node server).
- Browser-served TensorFlow premium model from `public/premium_model/`.
- **Disruption Prediction Model** (TensorFlow.js, 16-input, 4-output) trained on AQI + IMD rainfall datasets — predicts weather, AQI, traffic, and platform disruption severity 30 minutes ahead.
- **ML-Driven Rerouting Simulation**: predicts disruption zones on the live map and reroutes the delivery driver around them using OSRM real-road routing with `alternatives=3`.
- Live GPS map with **29 pre-mapped risk zones across 8 Indian cities** (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad).
- Disruption history log with aggregate stats and type breakdown.
- **AI Chatbot** powered by Google Gemini for in-app support.
- **Supabase** backend for user data, policy and claims persistence.
- **Multilingual i18n** support: English, Hindi, Marathi, Gujarati, Tamil, Telugu.

---

## 🏗️ System Architecture

![System Architecture](assets/SystemArchitecture.png)

---

## 👤 Persona-Based Scenarios & Workflow

### Persona 1: Ravi — Traditional Gig Driver

| Attribute | Details |
|-----------|---------|
| **Name** | Ravi, 38 |
| **Occupation** | Two-Wheeler Delivery Partner (Zomato/Swiggy) |
| **Location** | Flood-prone Mumbai Suburb |
| **Tech Literacy** | Moderate — uses smartphone daily for maps and delivery apps |
| **Pain Point** | Extreme rain forces him offline for 2-3 days, resulting in zero income and no safety net |
| **Goal** | Affordable, hassle-free income protection during severe monsoons |

**Scenario:**
> *Ravi relies on daily deliveries to support his family. He signs up for GigInc using his Aadhaar, selecting a ₹35/week gig-insurance plan. Three weeks later, a severe monsoon hits Mumbai. The OpenWeatherMap API registers persistent rainfall exceeding safely drivable levels. The physical disruption threshold is crossed. Ravi receives a push notification and an automatic counterfactual payout of ₹530 directly into his wallet to cover his lost operational hours, without ever filing a physical claim.*

**Workflow:**

```text
[Enrolment] → [Profile & Asset/Location Verification] → [Plan Selection]
     → [Weekly Premium Payment] → [Continuous API Trigger Monitoring]
          → [Automatic Counterfactual Payout on Trigger] → [Feedback & Renewal]
```

---

### Persona 2: Meena — Multi-App Gig Worker

| Attribute | Details |
|-----------|---------|
| **Name** | Meena, 29 |
| **Occupation** | Gig Delivery Rider (Blinkit/Zepto) |
| **Location** | High-density Chennai Suburb |
| **Tech Literacy** | High — navigates multiple gig apps simultaneously |
| **Pain Point** | Sudden app server crashes leave her stranded with zero hourly earnings |
| **Goal** | Flexible, low-cost weekly coverage she can pause if she takes time off between jobs |

**Scenario:**
> *Meena is working the busy evening shift when her delivery platform's server suffers a major 4-hour global outage. She is unable to accept orders and loses her peak earning window. GigInc's backend is continuously polling the platform's API status. It detects the massive downtime. Using its ML demand model, GigInc immediately calculates the "income lost" percentage, approves the claim, and deposits the missing wages into her account automatically.*

**Workflow:**

```text
[App Onboarding] → [KYC via Aadhaar/DigiLocker] → [Select Weekly Plan]
     → [Auto-debit weekly payment] → [Platform Server API Trigger Detected]
          → [AI Predicts Lost Income & Auto-Pays] → [One-tap Renewal]
```

---

### General Application Workflow

```text
User Registration
      │
      ▼
Identity Verification (KYC)
      │
      ▼
Risk Profile Assessment (AI-powered Geographic GPS tags)
      │
      ▼
Plan Selection & Weekly Premium Quote
      │
      ▼
Payment (UPI / Wallet / Bank Auto-debit)
      │
      ▼
Active Coverage Period Begins
      │
      ▼
Parametric Trigger Monitoring (Real-time Live APIs)
      │
      ├── NO TRIGGER → Continue Coverage / Auto-renew
      │
      └── TRIGGER DETECTED → ML Validation → Anti-Fraud Spoof Check → Auto Payout
```

---

## 💰 Weekly Premium Model & Parametric Triggers

### Why Weekly?

> *Daily wage earners and gig workers earn irregularly — income varies day to day and week to week. A weekly premium of ₹25–₹40 removes the single biggest barrier to insurance adoption: upfront cost. Unlike annual or monthly plans that require a lump sum, weekly micro-premiums align with how this population actually earns and spends. Users can also pause or skip a week between jobs, making it flexible rather than a fixed obligation.*

### Premium Pricing Model

| Plan Tier | Weekly Premium | Coverage Amount | Target User |
|-----------|---------------|-----------------|-------------|
| Basic | ₹25 | ₹500/day | Part-time gig workers |
| Standard | ₹35 | ₹600/day | Full-time delivery riders |
| Premium | ₹40 | ₹700/day | Cab drivers & logistics partners |

**Premium Calculation Factors:**
- **Geographic Risk Zone:** Users in high-traffic or flood-prone districts pay a slightly adjusted rate based on the historical trigger frequency in that hex.
- **Disruption Type Selected:** Weather APIs (Rain/AQI) and Server downtime status APIs carry different historical frequencies and are priced accordingly.
- **Coverage Duration:** Users who maintain uninterrupted weekly coverage receive loyalty discounts to reduce churn.
- **Prior Payout History:** Users with no triggered payouts over a 6-month period receive a no-claim discount on renewal.

---

### Parametric Triggers

Unlike traditional insurance, **no claim filing is required**. Payouts are triggered automatically when live external APIs indicate a measurable condition crossed a defined threshold.

| Trigger Type | Data Source | Threshold Example | Payout Condition |
|---|---|---|---|
| Extreme Weather Event | OpenWeatherMap API | Sustained heavy rainfall in GPS zone | Full/Partial based on ML counterfactual loss % |
| App Server Outage | Platform Status APIs | > 1 hour of zero response / high latency | Paid proportionally for downtime length |
| Hazardous AQI | Pollution APIs | AQI > 400 for 24+ hours | Partial health-buffer payout |
| Gridlock / Traffic Halt| Google Maps / Traffic Sensors | Major arterial blockage over 3 hours | ML scales payout based on "Platform Demand Left" |

**Trigger Justification:**
- **Objective:** All triggers use third-party data (Live Weather APIs, Platform status) with no subjective judgment. The threshold is either crossed or it is not.
- **Directly tied to income loss:** Rain stops riders, servers crashing stops orders. The trigger is the loss event itself.
- **No Moral Hazard:** Payouts are driven by external data, not user-reported claims. Users cannot influence whether weather or API servers crash.
- **Fast Payout:** Full automation means funds reach the user within minutes.

---

## 📱 Platform Choice: Web vs. Mobile

**Chosen Platform: Web App (Progressive Web Application)**

| Criteria | Web App | Mobile App | Our Choice |
|----------|---------|------------|------------|
| Target user device access | ✅ Desktop & Mobile browser | ✅ Smartphone only | **Web App (React/Vite)** |
| Offline capability | ❌ Limited | ✅ Better via PWA/native | |
| Distribution | ✅ No app store needed | ❌ App store required | |
| Push Notifications | ❌ Limited | ✅ Native | |
| Development cost | ✅ Lower | ❌ Higher | |
| Scale & Hardware | ✅ Works on older low-end OS | ❌ Restrictive version reqs | |

**Justification:**
> *We chose a highly interactive Web App (via React and Vite) because our target users (gig workers) often use budget smartphones with limited storage. A web-based application eliminates the App Store download hurdle, runs on severely constrained hardware, easily taps into the HTML5 Geolocation API for real-time risk dashboards, and drastically reduces our development costs for the Phase 1 prototype.*

---

## 🤖 AI/ML Integration

### 1. Dynamic Counterfactual Payout Engine
**Model Type:** Random Forest Regressor
**Inputs:**
- Weather Severity % (from live APIs)
- Platform Demand Left % (from server pings)

**Output:** Predicts exact "Income Lost %" during the disruption event.

**Justification:** *Static pricing tables fail to capture how variable real-world disruptions are. An ML model gracefully predicts how badly a specific storm combined with a specific drop in app demand slashes a rider's daily earnings, ensuring they get paid the exact fair counterfactual amount.*

### 2. Disruption Prediction Model (Ripple Model)
**Model Type:** Multi-output Dense Neural Network (TensorFlow/Keras → TF.js)
**Architecture:** 16-input features → Dense(64, ReLU) → Dense(32, ReLU) → Dense(4, Sigmoid)

**16-Input Feature Vector:**
- Temporal: `month_sin`, `month_cos`, `dow_sin`, `dow_cos`, `is_monsoon`, `is_winter_fog`
- Geospatial: `lat_norm`, `lon_norm` (normalized to India's bounding box)
- Environmental: `aqi_norm`, `aqi_lag1`, `aqi_lag7`, `aqi_roll7`, `rain_norm`, `rain_lag1`, `rain_lag7`, `rain_roll7`

**4-Output Disruption Scores** (each ∈ [0, 1]):
- `weather` — rainfall/storm severity
- `aqi` — air quality hazard level
- `traffic` — congestion disruption probability
- `platform` — platform outage risk

**Overall Risk Score:**
```
overallRisk = weather × 0.35 + aqi × 0.30 + traffic × 0.25 + platform × 0.10
```

**Training Dataset:** AQI data (2010–2023) from CPCB + IMD rainfall records across 8 Indian cities. Trained in `DisruptionModel_Colab.ipynb`, exported as TF.js LayersModel to `public/disruption_model/`.

**Inference:** Runs entirely in-browser via TensorFlow.js WebGL backend. Predicts disruption 30 minutes ahead and triggers rerouting in the live map simulation.

### 3. ML-Driven Rerouting Engine
**Purpose:** Proactively reroutes delivery drivers around predicted disruption zones before they encounter them.

**How it works:**
1. Fetches the direct road route from OSRM (`overview=full`, `geometries=geojson`)
2. Places the predicted disruption zone at 40% along the actual road route using cumulative distance interpolation
3. Requests OSRM alternative routes (`alternatives=3`) — all follow real roads
4. Selects the first alternative that does not intersect the danger zone
5. Falls back to perpendicular waypoint-based OSRM routing if no alternative naturally avoids
6. Validates every candidate route against the danger zone via point-by-point distance checks
7. Animates the driver along the safe route on the Leaflet map

**Key guarantee:** Both the direct (unsafe) and rerouted (safe) paths follow actual roads — no geometric straight lines.

### 4. Live Anti-Fraud Spoofing Engine
**Model Type:** Heuristic Distance Variance + Location Cross-Verification
**Signals Monitored:**
- Raw HTML5 Device GPS Coordinates
- IP Address Geolocation matching

**Output:** Instantly rejects claims if a rider spoofs their GPS (e.g., claiming to be in a flooded area while their network IP resolves thousands of kilometers away in a different state).

### 5. Visualizations
**Approach:** We run a parallel Streamlit dashboard to allow complete transparency into the Random Forest. It exposes the feature importance graph, training dataset size (5,000 synthetic records), and allows manual slider manipulation to test payout thresholds seamlessly.

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology | Reason |
|-------|-----------|--------|
| UI Framework | React 18, TypeScript, Vite | Fast compilation, modern interactive ecosystem |
| Styling | Tailwind CSS v4, Shadcn/ui | Beautiful, rapid, responsive, accessible components |
| Animations | Framer Motion | Provides micro-animations (crucial for premium UX) |
| Routing | React Router | Client-side navigation and protected routes |
| Maps | Leaflet | Live GPS map with risk zone overlays |
| Charts | Recharts | Income protection and disruption trend charts |
| Notifications | Sonner | Toast alerts for claims and payment events |

### AI/ML
| Component | Technology | Reason |
|-----------|-----------|--------|
| In-browser Inference | TensorFlow.js | Runs premium + disruption models directly in the browser (WebGL) |
| Disruption Model | Keras multi-output NN → TF.js | 16-feature, 4-output disruption severity prediction |
| Road Routing | OSRM (Project OSRM) | Real-road route computation with alternatives for ML rerouting |
| Model Training | Python, Pandas, Numpy, Keras | Proven data science foundation for neural network training |
| Dashboards | Streamlit | Rapid creation of Machine Learning visualizers |
| AI Chatbot | Google Gemini API | In-app conversational support for users |
| Connectivity | Localtunnel / Ngrok | Exposing Colab/Streamlit services to the public web |

### Infrastructure & Integrations
| Component | Technology |
|-----------|-----------|
| Backend / Database | Supabase (PostgreSQL, Auth, Row-Level Security) |
| Payment Gateway | Razorpay (UPI, card, netbanking, wallet) |
| SMS Notifications | Twilio via Cloudflare Worker or local Node server |
| Weather Data API | OpenWeatherMap API |
| Geolocation | HTML5 Geolocation API, IP-API |
| Internationalization | react-i18next (6 languages: EN, HI, MR, GU, TA, TE) |

---

## 🗓️ Development Plan

### Phase 1 and 2 — Foundation ✅ Complete
- [x] Landing page with animated hero, feature highlights, and mobile-responsive navigation
- [x] Auth/signup flow with persona selection (Hustler, Night Owl, Fair-Weather Rider)
- [x] Dynamic weekly premium calculation using TensorFlow.js ML model (trained on 3,000+ Indian delivery records)
- [x] Actuarial fallback formula when ML model is unavailable, constrained to ₹20–₹50/week
- [x] Razorpay payment gate (real + demo mode) before dashboard access
- [x] Dashboard home with member profile, activity stats, weekly income protection chart, and claims feed
- [x] Plans page with Normal and Premium tier comparison
- [x] AI Risk Insights page with live OpenWeatherMap integration and GPS-aware composite risk scoring
- [x] Parametric claims simulator with four disruption types (weather, AQI, traffic, platform outage)
- [x] Six-point GPS fraud detection engine (GPS vs IP, platform login, speed anomaly, accuracy fingerprint, frequency, weather mismatch)
- [x] Disruption history log with aggregate stats and breakdown by type
- [x] Live GPS map with 29 pre-mapped risk zones across 8 Indian cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad)
- [x] Real-time rider location tracking with nearest risk zone detection
- [x] **Disruption prediction model** trained on AQI + IMD rainfall data (DisruptionModel_Colab.ipynb)
- [x] **ML-driven rerouting simulation** — predicts disruption zones 30 min ahead and reroutes via OSRM real-road alternatives
- [x] SMS payout notification via Twilio SMS gateway (Cloudflare Worker / Node server)
- [x] Admin panel with portfolio metrics, BCR monitoring, and 14-day monsoon stress test
- [x] Google Colab notebook for ML model training and Streamlit visualizer
- [x] AI chatbot powered by Google Gemini API
- [x] Supabase backend integration (auth, policy data, claims persistence)
- [x] Multilingual i18n support (English, Hindi, Marathi, Gujarati, Tamil, Telugu)
- [x] Deployed to Vercel: [https://gig-inc-three.vercel.app](https://gig-inc-three.vercel.app)

### Phase 3 — Core Backend Integration 
- [x] Supabase PostgreSQL backend for persistent user and claims data
- [ ] Aadhaar eKYC via DigiLocker API
- [ ] Implement secure UPI auto-debit for recurring weekly premiums
- [ ] Real platform status API polling (Swiggy, Zomato, Amazon) for outage triggers
- [ ] Production Twilio SMS gateway with delivery receipts
- [ ] IRDAI Regulatory Sandbox application
- [ ] Partner with a licensed insurer as risk carrier
- [ ] Native Android app for offline-capable access
- [x] Multi-language support (English, Hindi, Marathi, Gujarati, Tamil, Telugu)

---

## 📎 Additional Considerations

### Regulatory & Compliance
*The platform will operate under the IRDAI Regulatory Sandbox framework, allowing us to pilot parametric insurance products before full licensing. We will partner with a licensed insurer as the risk carrier, with GigInc acting as the technology and distribution layer.*

### Data Privacy
> *All user PII is encrypted at rest and in transit. Location data collected by the Anti-Fraud engine is checked ephemerally to trigger payouts and discard. Aadhaar-based KYC follows UIDAI prescribed norms.*

### Financial Inclusion Goals
> *Our primary target is the gig workforce. The app interface relies heavily on iconography and clear visual indicators (like color-coded risk hexes) rather than dense text, catering to hurried riders in the field. Weekly micro-premiums ensure the program is financially accessible.*

---

## 🚀 How to Run the Demo

### Prerequisites
- Node.js 18+
- npm 9+
- Python 3.10+ *(only required to regenerate the Colab notebook or retrain ML assets)*

### Part 1: The React App

**1. Install dependencies**
```bash
npm install
```

**2. Set up environment variables**

Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_SMS_API_URL=http://localhost:8787/api/sms/send
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

**3. Start the development server**
```bash
npm run dev
```

Navigate to `http://localhost:5173`

**4. (Optional) Start the SMS gateway**
```bash
node sms-gateway/server.mjs
```

---

### Part 2: The ML Engine Visualizer (For Technical Judges)

**Method A: Google Colab (Zero-Setup — Recommended)**
1. Go to [Google Colab](https://colab.research.google.com/) and upload `InsureGig_Colab.ipynb`.
2. Run all cells. It will generate a live Localtunnel/Ngrok URL where judges can interact with the Random Forest sliders in their browser.

**Method B: Run Locally**
```bash
pip install -r ai_model/requirements.txt
streamlit run ai_model/streamlit_app.py
```

---

## 👥 Team & Contact

| Name | Role | Contact |
|------|------|---------|
| Haina kumari | Tech Lead | hainakumari1@gmail.com |
| Bipin Kumar | Full Stack Development | bipinkumar620013@gmail.com |
| Dhanush Thirunavukkarasu | AI Development | dhanushthiru@proton.me |
| Harsh Thakur | UI/UX Design | harsh06072006@gmail.com


---

