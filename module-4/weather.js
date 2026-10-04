// weather.js
// Look up current weather for a map location. It uses the weather-js module
// first, as the task specifies. weather-js scrapes MSN Weather, which is old
// and often returns nothing, so if it gives no result we fall back to the free
// Open-Meteo API. This way the endpoint always returns real data.

const weather = require("weather-js");

// Try weather-js. Resolves to a weather object, or null if it fails or is empty.
// A 4 second timeout stops it from hanging if MSN never responds.
function fromWeatherJs(location) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    setTimeout(() => finish(null), 4000);

    try {
      weather.find({ search: location, degreeType: "C" }, (err, result) => {
        if (err || !result || !result[0] || !result[0].current) return finish(null);
        const cur = result[0].current;
        finish({
          source: "weather-js",
          location: (result[0].location && result[0].location.name) || location,
          temperature: Number(cur.temperature),
          unit: "C",
          sky: cur.skytext,
          humidity: Number(cur.humidity),
          wind: cur.winddisplay,
          observed: cur.observationtime,
        });
      });
    } catch (e) {
      finish(null);
    }
  });
}

// Fallback: Open-Meteo. First geocode the place name, then read current weather.
async function fromOpenMeteo(location) {
  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location.split(",")[0]
    )}&count=1`
  );
  const gj = await geo.json();
  if (!gj.results || !gj.results[0]) return null;

  const { latitude, longitude, name, country } = gj.results[0];
  const w = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
  );
  const wj = await w.json();
  const c = wj.current || {};
  return {
    source: "open-meteo",
    location: `${name}, ${country}`,
    temperature: c.temperature_2m,
    unit: "C",
    humidity: c.relative_humidity_2m,
    wind: `${c.wind_speed_10m} km/h`,
    observed: c.time,
  };
}

async function getWeather(location) {
  let data = await fromWeatherJs(location).catch(() => null);
  if (!data) data = await fromOpenMeteo(location).catch(() => null);
  return data; // may be null if both fail
}

module.exports = { getWeather };
