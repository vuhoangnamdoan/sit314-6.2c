// dataModel.js
// Realistic weather generation and the fire-danger warning rule.
// Extends the Week 2 task, which used flat random numbers, by taking the
// month, the time of day and the region into account. Kept pure (no network)
// so it can be unit tested and reused by the sensors and the service.

// Victorian forecast districts (as in the Week 2 task), each with a simple
// climate profile. Values are rough baselines, not exact climate data.
const REGIONS = {
  Mallee:                    { baseTemp: 22, humidityBase: 45, windBase: 15, rainBase: 3 },
  Wimmera:                   { baseTemp: 20, humidityBase: 50, windBase: 15, rainBase: 5 },
  "Northern Country":        { baseTemp: 20, humidityBase: 52, windBase: 14, rainBase: 6 },
  "North Central":           { baseTemp: 19, humidityBase: 55, windBase: 14, rainBase: 7 },
  "North East":              { baseTemp: 16, humidityBase: 60, windBase: 12, rainBase: 9 },
  Central:                   { baseTemp: 18, humidityBase: 58, windBase: 16, rainBase: 8 },
  "South West":              { baseTemp: 16, humidityBase: 65, windBase: 20, rainBase: 10 },
  "West and South Gippsland":{ baseTemp: 16, humidityBase: 68, windBase: 18, rainBase: 11 },
  "East Gippsland":          { baseTemp: 17, humidityBase: 66, windBase: 16, rainBase: 10 },
};

const REGION_NAMES = Object.keys(REGIONS);

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Seasonal factor in [-1, 1]. Southern hemisphere: +1 in January (summer),
// -1 in July (winter).
function seasonalFactor(month) {
  return Math.cos((2 * Math.PI * (month - 1)) / 12);
}

// Daily factor in [-1, 1]. Peaks around 3pm, lowest around 3am.
function diurnalFactor(hour) {
  return Math.cos((2 * Math.PI * (hour - 15)) / 24);
}

// Generate one reading for a sensor type in a region at a given time.
//   type:   "temp" | "humidity" | "wind" | "rain"
//   region: one of REGION_NAMES
//   date:   a Date (defaults to now)
//   jitter: add random noise (true for real sensors, false for tests)
function generateReading(type, region, date = new Date(), jitter = true) {
  const p = REGIONS[region] || REGIONS.Central;
  const s = seasonalFactor(date.getMonth() + 1);
  const d = diurnalFactor(date.getHours() + date.getMinutes() / 60);
  const noise = (amt) => (jitter ? (Math.random() - 0.5) * 2 * amt : 0);

  let value;
  switch (type) {
    case "temp":
      // Warmer in summer and in the afternoon.
      value = p.baseTemp + 8 * s + 6 * d + noise(2);
      break;
    case "humidity":
      // Lower when it is hot and dry (summer afternoons).
      value = clamp(p.humidityBase - 15 * s - 10 * d + noise(5), 5, 100);
      break;
    case "wind":
      value = clamp(p.windBase + 6 * Math.max(0, s) + noise(6), 0, 90);
      break;
    case "rain":
      // More rain in the cooler months (negative seasonal factor).
      value = clamp(p.rainBase - 6 * s + noise(4), 0, 100);
      break;
    default:
      value = 0;
  }
  return Math.round(value * 10) / 10;
}

// Compute a simple fire-danger score and rating from a region's latest state.
// This is a simplified index, not the official FFDI, using high temperature
// and wind and low humidity and rain as the drivers of danger.
function computeFireDanger(state) {
  const temp = state.temp ?? 15;
  const wind = state.wind ?? 10;
  const humidity = state.humidity ?? 60;
  const rain = state.rain ?? 10;

  const score = temp * 0.5 + wind * 0.3 - humidity * 0.25 - rain * 0.6;

  let rating;
  if (score >= 22) rating = "Extreme";
  else if (score >= 14) rating = "High";
  else if (score >= 7) rating = "Moderate";
  else rating = "Low";

  return { score: Math.round(score * 10) / 10, rating };
}

// Decide whether to issue a weather warning for a region.
function decideWarning(region, state) {
  const danger = computeFireDanger(state);
  const warn = danger.rating === "High" || danger.rating === "Extreme";
  const message = warn
    ? `[${region}] WEATHER WARNING | Fire Danger: ${danger.rating}`
    : `[${region}] Conditions normal | Fire Danger: ${danger.rating}`;
  return { warning: warn, danger: danger.rating, score: danger.score, message };
}

module.exports = {
  REGIONS,
  REGION_NAMES,
  seasonalFactor,
  diurnalFactor,
  generateReading,
  computeFireDanger,
  decideWarning,
};
