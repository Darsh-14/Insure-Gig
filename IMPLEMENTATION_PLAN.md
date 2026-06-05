# InsureGig: Technical Implementation Plan

This document outlines the detailed technical implementation of the core features outlined in the hackathon brief. It serves as both a roadmap for development and a technical showcase for the judges.

---

## 1. AI-Powered Risk Assessment

**Goal:** Dynamically calculate a gig worker's *Weekly Premium* based on their risk persona, geographic data, and platform history.

### A. Dynamic Premium Calculation (Weekly Pricing Model)
* **Architecture:** 
  * Create a backend service (e.g., Node.js/Express or Python/FastAPI) exposing a `/api/premium/calculate` endpoint.
  * Input payload: Worker's average daily income, primary vehicle type, primary delivery zone (PIN code/geo-fence), and historical delivery volume.
* **Implementation:** 
  * Calculate a Baseline Rate (e.g., 2% of weekly earnings).
  * Apply multipliers based on external data. If the historical weather API shows the zone has high rainfall frequency, multiply by 1.15x. If the traffic API shows high congestion zones, multiply by 1.1x.
  * Return a fixed weekly premium (e.g., `₹57/week`). Store this explicitly in the database associated with the `WorkerID` and reset it every Sunday night via a chron job (e.g., using `node-cron` or Celery).

### B. Predictive Risk Modeling
* **Architecture:** 
  * A lightweight classification model (or simpler weighted heuristics for the hackathon).
* **Implementation:** 
  * Define common worker personas: "The Night Owl" (high crime/low visibility risk), "The Hustler" (lunch + dinner rush, traffic crash risk), "The Fair-Weather Rider" (skips rainy days).
  * Map these personas to specific multipliers. For the demo, hardcode 3 distinct JSON profiles to prove the calculation model interprets different worker risk types dynamically rather than statically.

---

## 2. Intelligent Fraud Detection

**Goal:** Prevent abuse of the parametric insurance model by validating claim legitimacy before any payout occurs.

### A. Location & Activity Validation (The Core Defense)
* **Architecture:** 
  * When a disruption trigger fires, the app requests the device's real-time GPS coordinates (`navigator.geolocation`). 
* **Implementation:** 
  * Cross-reference the GPS ping with the expected "Delivery Zone" of the worker using an algorithm like the Haversine formula to check distance.
  * **Anti-Spoofing:** Verify the consistency of the IP geolocation vs. the GPS coordinates. For the hackathon demo, write a function that calculates the distance between IP-derived location and GPS location. If `distance > 50km`, flag as spoofed and reject the claim.

### B. Anomaly Detection & Duplicate Claim Prevention
* **Implementation:** 
  * **Database Constraint:** In your `Claims` database table, implement a compound unique index on `WorkerID` + `DisruptionEventID` + `Date`.
  * **Logic Layer:** Before initiating a claim state, check: `SELECT COUNT(*) FROM claims WHERE worker_id = X AND timestamp >= NOW() - INTERVAL 4 HOURS`. If count > 0, reject as "Cooldown Period Active".

---

## 3. Parametric Automation 

**Goal:** Establish the "No Forms, Instant Payout" value proposition by removing humans from the claims loop.

### A. Real-Time Trigger Monitoring
* **Architecture:** 
  * An event-driven listener loop (Polling or Webhooks).
* **Implementation:** 
  * Create a background cron script `disruption_monitor.js` that runs every 15 minutes.
  * It pings external APIs for specific geographic zones where workers are currently active.
  * The rules engine evaluates conditionals: `IF weather.rainfall > 30mm AND platform.demand_index < 0.5 THEN TriggerEvent(Zone="Mumbai_South", Reason="Heavy Rain Drop")`.

### B. Automatic Claim Initiation & Processing
* **Implementation:** 
  * The `TriggerEvent` function queries all eligible workers in that zone who paid their weekly premium.
  * It calculates the payout using the Counterfactual algorithm you designed (Expected Income minus Actual Income).
  * Directly inserts a record into the `Payouts` ledger with status `APPROVED`.
  * Triggers a push notification or WebSocket event to the frontend: `"Claim of ₹317 auto-approved."`

---

## 4. Integration Capabilities

**Goal:** Connect the internal models to the real world using third-party APIs (Mocks are perfectly acceptable for Phase 1).

### A. Weather APIs (OpenWeatherMap / WeatherAPI)
* **Implementation:** 
  * Use the free tier of OpenWeatherMap.
  * Fetch current conditions: `GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={KEY}`.
  * Extract `weather[0].main` (e.g., "Rain") and `rain.1h` (e.g., 10.5mm). Pass this directly into your Parametric Automation logic.

### B. Traffic & Platform APIs (Simulated)
* **Implementation (Mocking strategy):** 
  * Since real platform data (Swiggy/Zomato orders) is private, build your own mock API: `/api/mock/platform/demand?zone=A`.
  * Make this mock API return a random JSON payload that you can manipulate.
  * *Hackathon Tip:* Add an "Admin Mock Panel" in your app where you can manually set the "Live Demand" to LOW to instantly trigger the Parametric condition during your pitch!

### C. Payment Systems (Stripe Sandbox or Razorpay Test Mode)
* **Implementation:** 
  * Integrate Stripe or Razorpay test endpoints for the Weekly Premium subtraction.
  * To demonstrate "Instant Payout", hit the Razorpay Route API (Payouts) mock endpoint or Stripe Connect Transfers to visibly show ₹317 being transferred from the InsureGig master account to the Worker's connected sub-account.
