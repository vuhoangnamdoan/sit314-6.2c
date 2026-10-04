// chairSensor.js
// A simulated chair occupancy sensor. Each instance represents one chair and
// reports to the edge node when a person sits on or leaves it.
//
//   CHAIR_ID    name for this chair             (default: chair_1)
//   SCENARIO    auto | occupied | empty         (default: auto)
//
//   auto      randomly toggles occupancy every few seconds (people coming/going)
//   occupied  reports the chair as taken and keeps it that way
//   empty     reports the chair as free and keeps it that way
//
// Example:
//   CHAIR_ID=chair_1 SCENARIO=occupied node sensors/chairSensor.js

const config = require("../config");

const chairId = process.env.CHAIR_ID || "chair_1";
const scenario = (process.env.SCENARIO || "auto").toLowerCase();
const url = `${config.edge.host}:${config.edge.port}/chair`;

let occupied = scenario === "occupied";

async function report() {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chairId, occupied, ts: Date.now() }),
    });
    console.log(`[${chairId}] occupied=${occupied}`);
  } catch (e) {
    console.error(`[${chairId}] edge not reachable:`, e.message);
  }
}

console.log(`[${chairId}] chair sensor, scenario = ${scenario}`);
console.log(`[${chairId}] posting to ${url}`);

if (scenario === "auto") {
  // Randomly change occupancy every 4 to 8 seconds and report each change.
  setInterval(() => {
    occupied = Math.random() < 0.5;
    report();
  }, 4000 + Math.random() * 4000);
} else {
  // Fixed state: report now and re-send every 10s so the edge always knows it.
  setInterval(report, 10000);
}
report();
