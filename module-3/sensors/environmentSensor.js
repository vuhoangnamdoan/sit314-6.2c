const config = require("../config");

const sensorId = process.env.SENSOR_ID || "env_1";
const scenario = (process.env.SCENARIO || "normal").toLowerCase();
const url = `${config.edge.host}:${config.edge.port}/environment`;

function between(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// Produce a reading based on the scenario.
function makeReading() {
  let temperature, humidity;
  switch (scenario) {
    case "hot":
      temperature = between(26, 32);
      humidity = between(45, 60);
      break;
    case "cold":
      temperature = between(14, 18);
      humidity = between(40, 55);
      break;
    case "humid":
      temperature = between(22, 24);
      humidity = between(65, 80);
      break;
    default: // normal, comfortable
      temperature = between(20, 24);
      humidity = between(40, 55);
  }
  return { sensorId, temperature, humidity, ts: Date.now() };
}

async function report() {
  const reading = makeReading();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading),
    });
    console.log(`[${sensorId}] sent ${reading.temperature}C ${reading.humidity}%`);
  } catch (e) {
    console.error(`[${sensorId}] edge not reachable:`, e.message);
  }
}

console.log(`[${sensorId}] environment sensor, scenario = ${scenario}`);
console.log(`[${sensorId}] posting to ${url} every 3s`);
setInterval(report, 3000);
report();
